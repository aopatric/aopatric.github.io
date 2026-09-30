---
layout: post
title: Finding the Edge of Stability for LLM Post-Training
# TODO: update description to reflect the revisit, e.g. "An undergrad null result, a rebuild of the measurement tooling, and what it actually took to ask the question properly."
description: Investigating an extension of the Edge of Stability phenomena in the context of language model post-training. Instruction tuning task built from the Alpaca dataset, using the Pythia model suite for pre-trained, non-instruction-tuned model organisms.
# TODO: placeholder thumbnail; swap for something else or drop
img: assets/img/eos-emergence-thumbnail.svg
importance: 1
category: academic, independent, optimization, LLMs, fine-tuning
related_publications: false
---

<!-- TL;DR (1–2 sentences, ~40 words): what the question was, that the original answer
("no EoS in post-training") turned out to be a measurement failure, and that the rebuild
ended inconclusive but taught you something real. Mention that this was always an
exploration, not something meant for publication. -->

**under construction!!!**

_tl;dr:_ does the training behavior of language models in post-training share a generally accepted characteristic previously observed in toy-scale models? previous attempt said no, but a revisit showed that was a weak claim. re-attempt ended inconclusively, but included rounds of iteration that taught me more about research engineering than any successful one could have.

(_note_: since this revisit was meant as an exploration and less of a publication, there were no novel figures generated beyond those in `tensorboard`. figures in this writeup come from existing literature and are cited as such.)

## The Edge of Stability?

<!-- ~200 words. Tighten the existing intro below. -->

Much of the success of modern neural networks is attributed to the wild success of learning with gradient descent (GD). In recent years, research effort has been poured into understanding the geometry of learning in neural nets trained with GD. A fruit of that effort is the established Edge of Stability phenomena, which describes a deviation observed in practice from previously established facts from statistical learning theory about learning on twice-differentiable smooth losses. The argument generally goes as follows:

We can take any twice-differentiable, smooth loss function $f(\theta)$ and consider a second-order Taylor approximation within some neighborhood of a stationary point $\theta^*$:

$$
f(\theta) \approx f(\theta^*) + \nabla f(\theta^*)^\top (\theta - \theta^*) + \frac 1 2 (\theta - \theta^*)^\top H (\theta - \theta^*).
$$

Since $\theta^*$ is a stationary point, $\nabla f(\theta^*) = 0$. Taking the gradient gives:

$$
\nabla f(\theta) = \nabla f(\theta^*) + H(\theta - \theta^*) = H(\theta - \theta^*)
$$

For Hessian $H$. So consider the gradient update step:

$$
\begin{align*}
  \theta_{t+1} & = \theta_t - \eta \nabla f(\theta_t) \\
  & = \theta_t - \eta H (\theta_t - \theta^*)
\end{align*}
$$

subtracting $\theta^*$ from both sides gives us our error vector to the optimum for each time step:

$$
\begin{align*}
  \theta_{t+1} - \theta^* & =  (\theta_t - \theta^*) - \eta H (\theta_t - \theta^*) \\
  \delta_{t+1} & = (I - \eta H) \delta_t.
\end{align*}
$$
 
So under this second-order approximation, each gradient update scales the error vector by $(I - \eta H)$, and we can treat it like any other linear mapping. So consider the eigendirection $\nu$ of $H$ with largest eigenvalue $\lambda_\text{max}$. Along $\nu$, the error update has eigenvalue $(1 - \eta \lambda_\text{max})$. So the error relation blows up along $\nu$ iff:

$$
\begin{align*}
  | 1 - \eta \lambda_\text{max} | > 1 \\
    1 - \eta \lambda_\text{max} > 1 \quad \text{or} \quad -1 + \eta \lambda_\text{max} > 1 \\
    \lambda_\text{max} < 0 \quad \text{or} \quad \lambda_\text{max} > \frac 2 \eta.
\end{align*}
$$

The first result tells us on an extremely high level that when we are atop a _hill_ in the loss landscape, gradient descent can roll off instead of reaching the peak. This half is irrelevant to our goal of reaching the bottom of a _valley_. However, the second result tell us that when we are near a valley, curvature like $\lambda_\text{max} > \frac 2 \eta$ can create local instability causing gradient descent to over-correct and similarly, our error blows up.

Nonetheless, the original [Cohen et al. (2021)](https://arxiv.org/abs/2103.00065) paper observed a two-stage phenomena including a phase of _progressive sharpening_ (wherein the local $\lambda_\text{max}$ at iteration $t$ starts low and rises monotonically to the $\frac 2 \eta$ threshold) and a phase of _stable oscillation_ (wherein the local curvature oscillates around the $\frac 2 \eta$ threshold while maintaining stability during training). This contradicted the predictions made by the second-order Taylor approximation above and raised several questions as to the nature of this phenomena, including whether this was an artifact of the particular training setup or an intrinsic property to gradient descent on neural networks. Since then, much work has expanded upon the original EoS paper, asking similar questions in new contexts.

<!-- FIGURE: Cohen et al. (2021) Fig. 1, sharpness rising to 2/η across several learning
rates. Replaces the old placeholder SVG. Credit it in the caption and link arXiv:2103.00065. -->

In particular, the EoS umbrella has grown to include conjugate named phenomena for stochastic gradient descent ([Andreyev & Beneventano (2024)](https://arxiv.org/abs/2412.20553)), adaptive optimizers ([Cohen et al. (2022)](https://arxiv.org/abs/2207.14484)), transformers ([dummy (XXXX)](dummy.link)), and [more](dummy.link). Nevertheless, it remains generally under-explored the extent to which (or if at all) EoS emerges in the context of language model post-training. 

<!-- TODO: fill in the remaining dummy links above. -->
<!-- 1–2 sentences: why the answer would be interesting either way. [your motivation] -->

### Aside: Why Post-Training?

To be fair, my introduction to this question was through a list of curated term project topics for MIT's 6.7910 Statistical Learning Theory. However, I chose to investigate this question as post-training poses a uniquely different training context than much of the existing literature on EoS. Namely, post-training posing a unique shift in _domain_, _target_, and even _learning rate_ which can all affect the degree to which EoS is observed. For that reason, I chose to structure my approach to answer this question around arguably the most common first fine-tuning step for early language models: _instruction tuning_.

## Round one: 6.7960, Fall 2025

<!-- ~150 words. -->
<!-- Setup: Pythia-[size], Alpaca instruction tuning, [optimizer/batch setup], [compute]. -->
<!-- What you measured and plotted: a single-batch curvature estimate vs. 2/η. -->
<!-- What you concluded: no EoS signal → "EoS doesn't persist into post-training." -->
<!-- One honest line on why it seemed convincing then: [deadline? flat curve? no reason
to doubt the tooling?]. -->

## Coming back to it

<!-- ~150 words. -->
<!-- What made you reopen it (Sept 2026, post-graduation, MEng). -->
<!-- The key realization from the audit: the experiment couldn't tell "no EoS" apart
from "no measurement." -->

- <!-- The curvature estimate was a noisy single-batch number, not a trustworthy λ_max. -->
- <!-- Configs broke invariants from the literature (gradient clipping, optimizer choice),
     so the setup wasn't the one where EoS is predicted in the first place. -->
- <!-- The claim was stronger than the code could support. -->

<!-- Transition: before asking the LM question again, build an instrument you trust and
show it can see EoS where EoS is known to exist. -->

## Rebuilding the instrument

<!-- ~250 words. The engineering core. -->
<!-- Framing sentence: validate the instrument before trusting it. Positive controls
first, and pass/fail criteria written down before the data. -->

**Measuring curvature you can trust.**
<!-- HVPs + two independent eigensolvers (power iteration, Lanczos) from separate random
starts that must agree within 1%. Checked against exact Hessians on tiny models;
bit-deterministic on GPU. -->

**Precision.**
<!-- At fine-tuning learning rates, float32 lost a median 3.4% of each update to
rounding, and the λ_max trajectory visibly diverged within 20 steps → float64 master
weights and float64 curvature evaluation. -->

**Changing one thing at a time.**
<!-- The order of experiments: from-scratch MLP with full-batch GD (positive control) →
pretrained Pythia-70m with full-batch GD → minibatch. A random-init Pythia run, meant to
separate pretraining from architecture and scale, was planned but never run. -->

**Deciding what counts before looking.**
<!-- `src.score` applies pass/fail tests frozen before the data. Why you bothered: to keep
yourself from reading a borderline curve as a positive result, which is exactly the
round-one failure. -->

**Harness.**
<!-- One line: Hydra configs, deterministic data order, exact resume, GPU memory
preflight, ~294 tests. Also how you split the work with Claude: it wrote tooling, while
you owned the design, the milestones, and what counted as evidence. -->

## What the revisit actually showed

<!-- ~150 words. No custom figures; state the numbers in prose. -->

<!-- Note near the top of this section: this was an exploration, so there are no
polished plots (only TensorBoard during the runs). Every number below is re-derived
from the logged runs, and the repo has instructions to reproduce them: [repo link]. -->

<!-- Minibatch Pythia-70m: λ_max on a fixed probe batch sat up to 2.5× above 2/η with no
instability and didn't fall as η rose. That's evidence of measuring the wrong quantity,
not evidence against EoS → move to full batch. -->

<!-- The positive control "failed" in an interesting way: on the MLP, λ_max settled
1.7–2.3× above 2/η, but GD was clearly oscillating, and curvature *along the step*
stayed near 2/η (0.89–1.13). This matches Lee & Lee (2026) and is why you built the
step-curvature tooling. -->

<!-- Optional FIGURE: from Lee & Lee (2026), step-direction sharpness sitting at 2/η
while λ_max overshoots. Credit it and link arXiv:2608.18415. -->

<!-- Pretrained Pythia-70m, full batch: at η=7.5e-6, oscillation begins around step
1100; reversal curvature ≈0.92 of the limit; last-third median 0.898 vs. a 0.9 pass
line. The scorer says FAIL, but the honest reading is inconclusive, not absent. -->

## Why I stopped, and what I learned

<!-- ~100–150 words. -->
<!-- Why you stopped: even a clean answer at 70m, 64 examples, and plain GD says little
about real post-training (AdamW, minibatches, scale), and getting there means renting
GPUs. A borderline signal didn't justify the cost. -->

- <!-- A null result is only as good as your ability to detect a positive one. -->
- <!-- λ_max isn't the right quantity once GD oscillates; curvature along the step is.
     (Optional: gradient-reversal "curvature" is ≈2/η by construction during any
     2-cycle, so it isn't independent evidence.) -->
- <!-- Something personal about process: [freezing tests before seeing data / knowing
     when to stop]. -->

<!-- Closing line: what you'd run next if you reopened it (the missing 3.8e-6 arm, the
random-init Pythia run, AdamW validation) + repo link. -->

## References

<!-- TODO: format these. -->
- Cohen et al. _Gradient Descent on Neural Networks Typically Occurs at the Edge of Stability._ ICLR 2021. [arXiv:2103.00065](https://arxiv.org/abs/2103.00065)
- Cohen et al. _Adaptive Gradient Methods at the Edge of Stability._ 2022. [arXiv:2207.14484](https://arxiv.org/abs/2207.14484)
- Andreyev, Beneventano. _Edge of Stochastic Stability: Revisiting the Edge of Stability for SGD._ 2024. [arXiv:2412.20553](https://arxiv.org/abs/2412.20553)
- Lee, Lee. _The Road Taken: The Role of Optimizers at the Edge of Stability._ 2026. [arXiv:2608.18415](https://arxiv.org/abs/2608.18415)
- Damian, Nichani, Lee. _Self-Stabilization: The Implicit Bias of Gradient Descent at the Edge of Stability._ ICLR 2023. [arXiv:2209.15594](https://arxiv.org/abs/2209.15594)
- Biderman et al. _Pythia: A Suite for Analyzing Large Language Models Across Training and Scaling._ 2023. [arXiv:2304.01373](https://arxiv.org/abs/2304.01373)
