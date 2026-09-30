# Postmortem: post-training-EoS

Stopped 2026-09-26; archived 2026-09-28.

## The question

Cohen et al. (2021) found that when a network is trained with full-batch gradient descent, the top Hessian eigenvalue λ_max rises until it reaches the stability limit `2/η` and then hovers there. This is the Edge of Stability (EoS). The question here was whether the same happens when a *pre-trained* language model is fine-tuned in a realistic context, namely instruction tuning.

The project began as an undergraduate course project, which reported that EoS did not persist to language model post-training. On a September 2026 revisit, my audit of that codebase showed that its result could not tell "no EoS" from "no measurement," for a couple of reasons. Namely:

* The plotted curve was an extremely noisy single-batch curvature estimate, and failed to accurately approximate $\lambda_\text{max}$.
* Experiment configurations failed to conserve key invariants of the training process (gradient clipping, algorithmic choices) from original literature and made claims stronger than what could reasonably be drawn from the codebase. 

This project is the rebuild after my audit, with much tooling written by Claude while I took ownership of design decisions and project segmentation including milestones and 294 tests for the instrumentation code.

## What was built

A curvature instrument for language-model fine-tuning, tested before it was trusted:

- **Hessian-vector products and two independent eigensolvers.** Power iteration and
  Lanczos run from separate random starts and must agree within a set tolerance (default $1\%$). The solvers are verified against exact Hessians on small models with `torch.autograd.functional.hessian()` and is bit-deterministic on GPU.
- **Step curvature infrastructure extension.** New tooling in `src/stepcurv.py` for measuring landscape curvature along the _step_ direction as opposed to the _sharpest_ direction, aligning with more recent literature in large-model EoS. Recovered EoS signal in established contexts with a small test MLP using new step curvature tools. 
- **float64 master weights and float64 curvature evaluation.** Built after discovering float32 was losing $\sim 3\%$ of information to error.
- **Configurable experimentation harness.** Hydra configs, deterministic data order, checkpoint and resume that reproduces an uninterrupted run exactly, a GPU memory preflight fitted on the RTX 4090, and a per-run environment record.
- **A scorer** (`python -m src.score`) that applies pass/fail criteria written down before the data they judge; measures for positive/negative sign of EoS, broadly.

Models tested include Pythia-70m and a small MLP trained from scratch, on Alpaca, on one RTX 4090. Decided against larger scale runs after confirming EoS for MLP and failing to see similar signs in smoke runs for Pythia-70M while on a compute budget.

## What happened

1. **The first positive control failed for a trivial reason.** A synthetic task was
   exactly learnable, so the loss went to zero and the curvature collapsed with it.
2. **Minibatch fine-tuning of Pythia-70m** (Rung 3; 20k examples, batch 64, six learning
   rates, four completed). Curvature was measured on a fixed 64-example probe. Its λ_max
   exceeded `2/η` by up to 2.5× without any instability, and it did not fall as the
   learning rate rose (log-log slope about +0.15; EoS predicts −1). The probe is not the
   loss being stepped on, so no stability limit applies to its λ_max. Under minibatch SGD
   the quantity that does reach `2/η` is curvature along the batch's own gradient
   (Andreyev & Beneventano). This motivated moving to full-batch runs, where the measured
   Hessian is the Hessian of the loss being stepped on.
3. **A positive control on real text** (Rung 0). A small MLP (3.28M parameters) was trained
   from scratch with full-batch gradient descent on 64 Alpaca examples, at three learning
   rates. It failed the pre-registered λ_max test: λ_max settled 1.7–2.3× *above* `2/η`,
   and training stayed bounded. Examining the checkpoints showed that gradient descent
   was oscillating, and that the curvature along the step sat near `2/η` even though
   λ_max did not. This led to measuring curvature along the step, and to new tests frozen
   before any further data.
4. **float32 was not accurate enough.** At the learning rates fine-tuning uses, float32
   weight updates lost a median 3.4% of every step to rounding. Within 20 steps the λ_max
   trajectory had visibly changed. All later runs use float64 master weights.
5. **Full-batch fine-tuning of pretrained Pythia-70m** (Rung 2; 64 examples, 2000 steps),
   scored against the frozen step-direction tests. This result was inconclusive (below).
   The project stopped here.

## Results

Numbers are re-derived by `python -m src.score` and `scripts/orbit_diagnostics.py` from the
logs in `results/`. Ratios are relative to `2/η`, where 1.0 is the edge.

**Rung 0: small MLP from scratch, three learning rates (η = 0.054 / 0.109 / 0.272).**

| | η = 0.054 | η = 0.109 | η = 0.272 |
|---|---|---|---|
| λ_max, last-third median (steps 2667–4000) | 1.74 | 2.13 | 2.28 |
| Curvature along the step, HVP (median of 5, steps 4000–4400) | 1.13 | 1.02 | 0.89 |
| Curvature along the step, at the orbit centre (step 4000) | 1.01 | 0.96 | 0.92 |
| Gradient reversal, cos(g_t, g_{t−1}) | −0.997 | −0.955 | −0.984 |
| Loss alternates step to step (last third) | 99.7% | 73% | 75% |

Gradient descent oscillates while the loss still falls over the run. λ_max at the iterate
overshoots the limit, while curvature along the step stays within ~13% of it.

At η = 0.054 the run is a clean, stable two-step orbit. The sharpest direction has
curvature 61 at one iterate and 19 at the next, against `2/η` = 37. A perturbation along it
shrinks over two steps. At the other two rates the run is bounded but not a clean orbit,
and at η = 0.109 the sharpest direction is locally unstable, yet training never diverged.

The frozen scorer rates Rung 0 a **FAIL**. The λ_max test fails, and the step-direction
tests could only be run on a 400-step continuation, where the "arrives at the edge" test
cannot be evaluated.

**Rung 2: pretrained Pythia-70m, full-batch GD.**

* **η = 1.9e-6.** No oscillation (gradient cosine +1.0). The curvature along the step was
  about 1.7e-4 of the limit, roughly 6,000× below it, while λ_max sat at about 0.5 of the
  limit. At this rate, fine-tuning moved in directions far flatter than the sharpest one.
* **η = 7.5e-6.** Oscillation began around step 1100, and the gradient cosine settled near
  −0.85. For the final ~200 steps the curvature from gradient reversal was about 0.92 of
  the limit. The last-third median was 0.898, just under the 0.9 pass line. The HVP along
  the step was ~1.5 at the end and λ_max ~1.8. Unlike the toy, the loss rose on only 5% of
  last-third steps (36 of 666) rather than alternating.
* **Verdict.** The frozen scorer rates it a **FAIL**. The 7.5e-6 arm missed the lock test
  (0.898 against 0.9, with 48% of steps in band against the 67% required) and the
  agreement test. More basically, only two of the three pre-registered learning rates were
  run, and the verdict requires three. The run was near the edge, oscillating, with λ_max
  above the limit and no instability, but it never settled in a way the tests could
  accept. This is an inconclusive result, not a demonstration that EoS is absent.

## What this does and does not show

It shows:

- **λ_max at the current iterate does not decide stability once gradient descent
  oscillates, so a test that requires it to sit in a band around `2/η` can miss an
  oscillating run.** λ_max stayed 1.7–2.3× above `2/η` on the toy and up to 1.8× above it
  on Pythia-70m, with training bounded in both. On the toy, curvature along the step stayed
  near `2/η` (0.89–1.13 by HVP). That rests on one small model, five HVP measurements per
  learning rate and three checkpoints, but it matches Lee & Lee (2026): in full-batch GD on
  an MLP they find λ_max up to 1.62× the limit, while curvature along the update stays at
  ~0.98. Cohen et al. (2021) also note that sharpness at the iterates and between them can
  differ. On Pythia-70m the step-direction HVP ended at ~1.5, so there the step direction
  was not near the edge either.
- **Curvature from gradient reversal is not evidence on its own.** For plain GD, the secant
  ratio is `(1 − cos(g_t, g_{t−1})·‖g_t‖/‖g_{t−1}‖)/2`, so any steady two-step oscillation
  puts it at exactly `2/η`. Its "lock" and its 1/η scaling across learning rates are
  automatic. Only an independent measurement of the Hessian along the step (the HVP rows
  above) says something about curvature
  ([design.md §9](docs/design.md#9-curvature-along-the-step)).
- **Numerical precision matters at fine-tuning learning rates**, enough to change the
  measured trajectory.

It does not show:

- **Whether fine-tuning a pretrained LM reaches EoS.** Rung 2 was one model, 64 examples,
  2000 steps and one informative learning rate, and it ended inconclusive.
- **Anything about transformers as such.** Cohen et al. (2021) observed EoS in a Transformer
  trained from scratch on WikiText-2. The step from the toy to Pythia-70m changes
  pretraining, architecture, model size and data size at once. The one experiment designed
  to separate pretraining from the rest (Rung 1: a randomly initialised Pythia-70m on the
  same protocol) was never run.
- **Anything about square loss.** Every run here uses cross-entropy.
- **Anything about AdamW**, which real post-training uses. That code is unit-tested but was
  never validated on a known case.

## Why we stopped

Settling the Pythia-70m question would take a few more cheap runs: the missing 3.8e-6 arm,
longer runs, and Rung 1. But even a clean answer at 70m, 64 examples and plain gradient
descent would say little about real post-training, which uses AdamW, minibatches and much
larger models. Getting there would mean renting GPUs, and first validating the AdamW
measurement on a known case. A borderline signal at 70m did not justify that cost.

## Deviations and known gaps

- **3.8e-6 not run.** After the 1.9e-6 arm, the 7.5e-6 arm was launched by hand, to get the
  most informative arm first. The 3.8e-6 arm was never run, so the Rung 2 verdict could
  not pass.
- **Step-direction tests defined on Rung 0's data.** They were designed after examining
  Rung 0's runs, then frozen before Rung 2. For Rung 0 they are a description, not a test.
- **Diagnosis numbers were partly wrong.** The post-hoc Rung 0 figures in
  `docs/preregistration.md` §4.6 were first written without a saved script. Regenerating
  them reproduced the η = 0.054 curvature figures but not the eigenvector alignment or
  the other two arms (see the correction at the top
  of that file). The table above uses the regenerated values.
- **The first Rung 2 run was lost.** Its run directories (2026-09-15; float32, λ_max only)
  are gone, and only a summary table survives in design.md §11.
- **Uncommitted code during both Rung 2 arms.** Both record `bad2ea3` with uncommitted
  changes.
- **Unsupported claim in a config comment.** `fullbatch-gd-control.yaml` says float32 HVPs
  on Pythia-70m move by up to ~3% with padding. No saved run backs that figure; float64
  curvature evaluation was adopted on that basis.

## Reproducing and reopening

`results/` holds every kept run's `config.yaml`, `env.json`, `metrics.jsonl`,
`events.jsonl` and `summary.json`. The only weights kept are the three Rung 0 step-4000
checkpoints (`results/*_eosdemo_w64_r0?_full/checkpoints/last/`, 13 MB each), which the
diagnosis script needs. The Pythia-70m weights (1.6 GB per run) were not kept; the runs can be
repeated from their configs.

| Runs in `results/` | What |
|---|---|
| `2026-09-15_17-55-12_sweep_70m_full_sgd_lr*` | Rung 3, minibatch ladder |
| `2026-09-17_21-07-58_eosdemo_w64_cal` | Rung 0 calibration |
| `2026-09-17_*_eosdemo_w64_r0{1,2,5}_full` | Rung 0, steps 0–4000 |
| `2026-09-17_*_eosdemo_w64_r0{1,2,5}_full_validate` | Rung 0, steps 4000–4400 with step curvature |
| `orbit_diagnostics.json` | Rung 0 checkpoint diagnosis (`scripts/orbit_diagnostics.py`) |
| `2026-09-26_18-*_fullbatch_smoke_fp{32,64}` | float32 vs float64 master weights |
| `2026-09-26_19-05-15_fullbatch_cal` | Rung 2 calibration |
| `2026-09-26_20-00-08_sweep_fullbatch_*_lr1.9e-06`, `2026-09-26_21-31-37_fullbatch_*_lr7.5e-06` | Rung 2 |

```bash
python -m src.score results/<arm> results/<arm> ...   # verdicts
python -m scripts.orbit_diagnostics results/*_eosdemo_w64_r0?_full   # Rung 0 diagnosis
```

The next informative experiments, in order:

1. The missing 3.8e-6 arm and longer runs on pretrained Pythia-70m, with the tests
   unchanged.
2. Rung 1, a randomly initialised Pythia-70m on the same protocol, to separate pretraining
   from architecture and size.
3. A known-case validation of the AdamW measurement before using it on a language model.

## References

- Cohen, Kaur, Li, Kolter, Talwalkar. *Gradient Descent on Neural Networks Typically Occurs
  at the Edge of Stability.* ICLR 2021. [arXiv:2103.00065](https://arxiv.org/abs/2103.00065)
- Cohen et al. *Adaptive Gradient Methods at the Edge of Stability.* 2022.
  [arXiv:2207.14484](https://arxiv.org/abs/2207.14484)
- Andreyev, Beneventano. *Edge of Stochastic Stability: Revisiting the Edge of Stability for
  SGD.* 2024. [arXiv:2412.20553](https://arxiv.org/abs/2412.20553)
- Lee, Lee. *The Road Taken: The Role of Optimizers at the Edge of Stability.* 2026.
  [arXiv:2608.18415](https://arxiv.org/abs/2608.18415)
- Damian, Nichani, Lee. *Self-Stabilization: The Implicit Bias of Gradient Descent at the
  Edge of Stability.* ICLR 2023. [arXiv:2209.15594](https://arxiv.org/abs/2209.15594)
- Biderman et al. *Pythia: A Suite for Analyzing Large Language Models Across Training and
  Scaling.* 2023. [arXiv:2304.01373](https://arxiv.org/abs/2304.01373)
