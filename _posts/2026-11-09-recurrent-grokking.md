---
layout: distill
title: On the Mechanistic Function of the Recurrent Block in Looped Transformers, Part 1
date: 2026-11-08
description: Brief results blog post for part 1 of a 2-part study on the nature of the computation that happens inside the looping component of a looped transformer, this time on a task that needs no iterative computation. Motivated by studying the impact of increased serial depth on monitorability. Reproduction code for data and figures is <a href='https://github.com/aopatric/recurrent-grokking'>here</a>.
authors:
  - name: Angel Patricio
    url: "https://aopatric.github.io"
    affiliations:
      name: Independent
tags:
categories:
bibliography: 2026-10-23-recurrent-grokking.bib
---

<!-- TL;DR Section: Probably done? Maybe revisit once I'm at the tail end of this clean-up. -->

tl;dr: I compare toy-scale versions of several looped transformer variants (two plain looped transformers<d-cite key="dehghani2019universal"></d-cite> and one Huginn-style looped transformer<d-cite key="geiping2025huginn"></d-cite>) and a one-layer transformer baseline<d-cite key="vaswani2017attention"></d-cite>, trained on 1- to 3-hop addition chains mod 113 using the recipe from Nanda et al. (2023)<d-cite key="nanda2023progress"></d-cite>, with gradient clipping and learning rate decay added late in training to fix the loops' training instability. I study the mechanistic function of the recurrent block in the looped models, comparing how much of their learned algorithms align with the canonical "clock" algorithm<d-cite key="nanda2023progress,zhong2023clock"></d-cite>. I find that none of the loops add sequentially, instead using attention averaging to aggregate all information before reading out the answer. All but one run shows signs of clock-style readout, and the looped models showing signs of clock-style readouts held up better at an extrapolated chain length of 6 hops than the one-layer model, though the one-layer model stayed on Nanda's recipe. I also find that in plain loops the answer can be decoded linearly from the hidden state with a probe<d-cite key="alain2016probes"></d-cite> before the model's own decoder stack can read out the answer. This trend weakens with more hops, but the probe is at least 2 passes ahead of the output layer in all plain looped trials at 1–3 hops. I observe that accuracy at the training depth masks the different loop usages when used as a measured performance metric, with plain loops breaking beyond their training depth and the Huginn-style loop ignoring its hidden state by the end of training, reading only from the re-injected input.

This work is accompanied by an in-progress part 2, a contrasting study in a problem setting where there exists no one-pass shortcut. It additionally motivates further exploration into the development of monitoring tools for understanding _both_ the __intra- and inter-token computation__<d-cite key="skye2026shadow"></d-cite> in looped transformers.

<small>
(A note from me: number of runs possible was heavily compute- limited. Mechanistic results for the one-layer model, the Huginn-style loop and the sandwich-norm loop, and the training fix, are at two seeds; training ablations were run on one, with a few key baselines repeated at a second. There was no full hyperparameter sweep, and the remaining checks are at one seed. I mark each result with its seed count.)
</small>

<small>
Disclaimer: this is still a WIP, and may contain some draft prose written with the help of Claude.
</small>

<!-- Foreword Section: Still have to read through this one and get some ideas, but it's like 2 lines long so maybe not too bad to just read over and re-write if necessary. -->

## Foreword: Somewhere to Start

In the [accompanying essay](/blog/2026/recurrent-grokking-essay/) that motivated this project, I argued that monitoring models built to reason with latent thoughts<d-cite key="geiping2025huginn,zhu2025ouro"></d-cite> requires tools designed to read from these thoughts themselves, not just the model output. Before any such tool can be trusted, it must first be verified against some ground truth<d-cite key="lindner2023tracr"></d-cite>. We don't get one when we work with frontier models. Even in the cases where we get full open-weight access, nobody knows what algorithm the model is running, and we end up with little to verify our tools against. A cleaner place to start is a problem setting where that ground truth is already established.

Training simple transformers on addition mod 113 is one of the best-studied settings in mechanistic interpretability<d-cite key="nanda2023progress,zhong2023clock"></d-cite>. In this context, a one-layer transformer has been shown to learn an addition algorithm mapping inputs to rotations about a latent clock<d-cite key="nanda2023progress"></d-cite>, with the model's unembedding reading off the answer. That algorithm is the reference point for this extension, which asks whether this behavior continues in toy-scale models of different loop-based architectural families, and whether looping changes the nature of the learned computation. I extend the problem setting to multi-step addition, which gives a loop something to iterate over and lets me test on chains longer than those seen in training. Since addition is commutative, this introduces the potential for a one-pass shortcut<d-cite key="liu2023shortcuts"></d-cite>: gathering all inputs. Nothing forces the looped models to iterate, so whether they do is part of the question.

## Background and Experiment Setup

The setup for this experiment directly builds upon the one from the same Progress Measures for Grokking via Mechanistic Interpretability<d-cite key="nanda2023progress"></d-cite> paper mentioned earlier. In the original work, the authors take one-layer transformers with learned positional embeddings and, importantly, _no normalization_ (the looped models here do use norms), train them on the task of predicting $(a+b) \bmod 113$ as next-token completions on inputs of the form `a b = `, and reverse-engineer the learned algorithm. For the sake of simplicity, the answer is read off as a completion from the model's output at `=`. The original work trains standard one-layer transformers on 30% of the 113$^2$ possible input pairs, leaving the other 70% for validation. They use full-batch AdamW<d-cite key="loshchilov2019adamw"></d-cite> with weight decay $\lambda=1$ and $\beta = (0.9, 0.98)$. Models are trained with a learning rate of $10^{-3}$ for 40k steps.

My extension seeks to compare against the original along three axes: the data, the models, and the training recipe.

### Data

Similar to the original work, my data takes the form of operands and an equals sign, with no operator tokens; the longer chains look like a sequence of operands followed by the same `=` token, so the vocabulary is just the 113 numbers plus `=`. Models are trained on 1- to 3-hop chains, and 4- to 6-hop chains are held out to test length extrapolation. An example 6-hop chain is below; note that it's made entirely of training pairs. Except for the held-out-pair test at the end of this section, every longer chain is built this way, so performance on unseen chain lengths stays separate from performance on unseen inputs.

{% include figure.liquid
   path="assets/img/recurrent-grokking/six-hop-chain.svg"
   class="img-fluid rounded"
   zoomable=true
   alt="Eight token boxes, 50 79 2 18 97 91 79 =, with an arrow to the answer 77. Below them, the running sums 16 18 36 20 111 77, each under the number that produced it."
   caption="An example 6-hop chain from the length-extrapolation set. During training, the model only sees chains of up to 3 hops. Every step of the running sum is a training pair, so length is the only new variable."
%}

As in the original work, the 1-hop training set is 30% of the $113^2$ pairs; the 2- and 3-hop training sets have 15,000 chains each. Although we'd ideally have an equal number of samples for each chain length, the 1-hop chains only have about 13,000 possible combinations (about 3,800 in training) and we need a held-out set. To get around this limitation, each hop count gets its own data batch and losses are averaged with equal weight at training time.

Validation for 1-hop chains is done on unseen input pairs (10% of the $113^2$ pairs, rather than the original 70%), whereas the 2- and 3-hop chains are evaluated on 2,000 unseen chains each consisting of _seen input pairs_. A model is considered "grokked"<d-cite key="power2022grokking"></d-cite> once its validation accuracy, averaged across the 1- to 3-hop chains, is at least 0.9. To test length extrapolation, I also construct 2,000 chains each at 4, 5, and 6 hops, from the same training pairs. 

The remaining 60% of input pairs are kept out of training and validation entirely, and are instead used for a separate test studying input generalization. I build 2,000 chains per hop count from 2 to 6 hops in which exactly one step uses a held-out pair. The position of the held-out step varies. Every run that grokked (two seeds per model, one for the state-norm loop) scored in the 0.96-1.00 range on these at 2-3 hops. At 4-6 hops an unseen pair costs at most around 0.05 accuracy against chains of only training pairs, suggesting models learned to perform legitimate addition calculations and not just training data memorization.

### Models

My comparison covers three model families. I use a one-layer transformer<d-cite key="vaswani2017attention"></d-cite> as the reference, since its algorithm is already known, and compare it against two plain looped transformers (shared weights, not much else) built from the ideas in the Universal Transformers paper<d-cite key="dehghani2019universal"></d-cite>, as well as a variant of Huginn<d-cite key="geiping2025huginn"></d-cite>, chosen as an example of how current looped language models are built.

A note about normalization: all the looped models examined use some form of normalization, either on the state or around each sublayer (sandwich-style). Without norms, none of the five looped or multi-layer variants I tried grokked within 20k steps on Nanda's recipe (single runs), while the one-layer model did. The two plain loops differ only in where their norms sit: the state-norm loop normalizes the state after each pass, and the sandwich-norm loop adds norms around each sublayer. All norms are RMSNorms<d-cite key="zhang2019rmsnorm"></d-cite>.

A more detailed overview of the differences between the studied model families is below.

| | One-layer | Plain loop | Huginn-style loop |
|---|---|---|---|
| Layers | 1 | 1, shared across passes | prelude (1), shared core (1), coda (1) |
| Passes in training | 1 | 8 | sampled each step, 1–24 (mean 8) |
| Passes at evaluation | 1 | 8 | 8 |
| Initial state | n/a | the embedding | random noise, redrawn every forward pass |
| Input after pass 1 | n/a | none | prelude output re-injected every pass |
| Norms | none | state-norm: on the state after each pass; sandwich-norm: around each sublayer, plus on the state | sandwich norms |
| Readout | unembed at `=` | unembed the final state at `=` | coda and a final norm, then unembed |
| Backprop | full | through all 8 passes | through the last 4 passes |

All models share Nanda et al.'s widths ($d_\text{model} = 128$, 4 heads of size 32, $d_\text{mlp} = 512$), untied embedding and unembedding matrices, and NoPE<d-cite key="kazemnejad2023nope"></d-cite> (no positional embeddings). NoPE keeps the 4- to 6-hop test from relying on positions no model saw in training; my 1-hop reproduction of Nanda et al. kept their learned positional embeddings.

### Training Recipe + Instability

Before continuing with my own suite of trials, I train a one-layer transformer on the 1-hop chains with the full 40k training steps to replicate their results. The rest of the models described below are trained for 20k steps because of compute limits.

All observed models begin training under the recipe from the Progress Measures paper<d-cite key="nanda2023progress"></d-cite>, including the 10-step warmup and constant learning rate after the warmup. This decision was made in order to enable direct apples-to-apples comparison between the one-layer model and the new runs. An interesting problem: for all models built with normalization (_independent_ of the presence of loops in the architecture: normalized unshared 2- and 8-layer stacks did it too, at two seeds), this recipe proved highly unstable from early on in training. There were repeated dramatic spikes in the loss, with models that were able to grok entering cycles of collapsing then regaining their accuracy. This holds many similarities to the periodic oscillation observed by Lobacheva et al.<d-cite key="lobacheva2021periodic"></d-cite> when training with normalization and a high, constant (lr $\times$ weight decay), though mostly with SGD rather than AdamW. The exact mechanism isn't pinned down, but weight decay at a constant learning rate drives it: in branch runs, changing only the weight decay changed how often models collapsed.

Nonetheless, this instability was addressable with a two-phase training schedule, found through branch experiments restarting from a grokked checkpoint with gradient clipping and learning rate decay. This remedy kept grokked checkpoints stable, and additional runs were conducted to verify that this method works when training from scratch in this context: Nanda's recipe to 14k steps, then gradient clipping at 1.0 and a linear learning rate decay to 1% by 20k. All 5 two-phase runs that grokked ended at a validation accuracy of at least 0.99, while at seed 42 the constant-lr twins ended at 0.18 (sandwich-norm loop) and dipped to 0.34 (Huginn-style loop). This schedule does not, however, _guarantee_ an observation of grokking in the resulting model. Of the models examined, one (the state-norm loop at seed 42) did not grok within 20k steps under the two-phase schedule. Mechanistic results below are built on the final checkpoints from these two-phase runs; the one-layer model was trained on Nanda's recipe for the same 20k steps.

Additional ablation results, and an appendix with the ablation figures, are coming in an update to this post.

## Results and Discussion

### Observation 1: Attention Averaging

A good place to start is how the models use their attention to read information from the input. In theory, a loop working through the chain left-to-right would move attention from one token to the next across passes. The figure below shows this isn't what I observed. In all loops, attention from `=` is spread evenly over the entire chain. This is true in every block, pass, head, and chain length. Normalized entropy for this spread is at least 0.999 everywhere, so we're pretty close to about as evenly as the model could possibly spread its attention. This is also not special in the `=` token; in 3-hop chains, every position averages over the tokens it can see through the causal mask. This figure shows the attention maps from `=` in each head of each model, at the first pass from the seed 41 run. The other passes and results from seed 42 look the same.

{% include figure.liquid
   path="assets/img/recurrent-grokking/attention.png"
   class="img-fluid rounded"
   zoomable=true
   alt="Heatmaps of attention from the = token to each token of the chain, per head, for the one-layer model, both plain loops and the Huginn-style loop, on 3-hop and 6-hop chains. Every loop's weights are even: 0.20 at 3 hops and about 0.12 at 6 hops. The one-layer model's are even over the numbers, with two heads nearly skipping the = token."
   caption="Attention from <code>=</code> to each token, per head, in each model's first pass (for the loops, the shared block's first pass). Averaged over 1,000 chains at 3 and 6 hops."
%}

This behavior is closer to what you'd expect from the one-layer model doing this arithmetic. Since attention is the only way to move information from the inputs to the $=$ token in a one-layer model, and since addition is commutative, averaging attention is enough. Where the one-layer model differs is the `=` token itself: some heads actually learn to put little weight on it (around 0.01, against 0.12 for an even split at 6 hops), namely 2 of 4 heads at seed 41 and 3 of 4 at seed 42. The rest weight it as if it were a number, or even a bit more.

So the loops and the one-layer model gather their inputs the same way, with a near-uniform average of the chain: the one-pass shortcut from the setup. Nothing in the loops' attention changes from pass to pass. The rest of the results look at what the models compute from that average, and when.

### Observation 2: A Clock Readout

Once the numbers are averaged at `=`, the model still has to turn them into an answer. Nanda et al.'s one-layer model reads its answer off a clock<d-cite key="nanda2023progress,zhong2023clock"></d-cite>: the logit for each candidate answer $c$ is a sum of $\cos(w(a+b-c))$ over a few key frequencies $w$, which peaks at the right answer. I fit the same form to every model's logits on the 1-hop grid and ask how much of the readout it explains.

{% include figure.liquid
   path="assets/img/recurrent-grokking/clocks.png"
   class="img-fluid rounded"
   zoomable=true
   alt="Three panels. Left: bars of how concentrated each run's embedding and unembedding are over frequencies; the unembedding is more concentrated in every run but the seed-41 sandwich-norm loop. Middle: the share of logit variance explained by the top k frequencies, which levels off near 5 frequencies for the one-layer model and near 20 for the loops, while the seed-41 sandwich-norm loop stays close to chance. Right: the loss after removing the top k frequencies, which rises toward a uniform guess by about 20 frequencies for the loops."
   caption="Three measures of how clock-like each run's readout is, on the 1-hop grid."
%}

The figure measures this three ways. The left panel shows the gini coefficient of each weight matrix's norm over the 56 frequencies (0 if it's spread evenly, 1 if it all sits on one frequency), for the embedding $W_E$ over the input numbers and the unembedding $W_U$ over the answers. The middle panel fits $\cos$ and $\sin$ of $w(a+b-c)$ at the readout's top $k$ frequencies to the logits and shows the share of their variance it explains. The right panel removes those same frequencies from the logits and shows the loss on the training pairs: if the clock carries the answer, the loss should climb to that of a uniform guess, $\ln 113 \approx 4.73$. The dotted lines mark chance: a random matrix's gini on the left, a readout with no clock in the middle, and a uniform guess on the right. The gini coefficient and the loss with the key frequencies removed (the "excluded loss") follow Nanda et al.'s progress measures<d-cite key="nanda2023progress"></d-cite>.

Every run reads its answer off a clock, except one. The one-layer model's clock uses about 5 frequencies: they explain 0.84 and 0.88 of its logits' variance (seeds 41 and 42), and adding more frequencies adds nothing. The loops spread theirs over about 20 frequencies, which explain 0.86 to 0.94. Removing those 20 frequencies from the logits pushes the loops' loss on the training pairs close to that of a uniform guess, so the clock carries the answer rather than just fitting it. (The one-layer model's loss overshoots a uniform guess when its top 5 frequencies are removed, because its remaining logits are large and confidently wrong; that's the scale of its logits, not a bigger clock.) The unembedding is also far more concentrated on a few frequencies than the embedding: a gini of 0.43–0.48 against 0.17–0.32, where a random matrix gives 0.02.

The exception is the sandwich-norm loop at seed 41. Its top 20 frequencies explain only 0.40 of its logits' variance, removing them barely changes its loss, and its unembedding is barely concentrated at all (gini 0.09). It doesn't extrapolate to 6 hops either. Its seed-42 twin has a clock like the others, so which solution the sandwich-norm loop finds depends on the seed. One difference between the two runs: the seed-41 run grokked late, at step 18,800, after the switch to clipping and learning rate decay, while the seed-42 run grokked at step 8,000. Whether that's why it found a different solution is untested.

Only the readout is clearly a clock, though. The embeddings lean toward the readout's frequencies (58–85% of the embedding's squared norm sits on the readout's top 20 frequencies, against 36% for an even spread), but much less sharply than the unembedding, and most MLP neurons don't follow a single frequency. How each model computes the sum before the readout isn't established here.

The clocks also line up with the 6-hop gap from the tl;dr. If a clock came straight from an even average of the chain, it would shrink as the chain gets longer, since averaging more numbers dilutes each one: to 0.38 of its 1-hop size at 6 hops. The one-layer model's clock shrinks a little faster than that, to 0.28 and 0.30, and its 6-hop accuracy is 0.60 and 0.79. The loops' clocks barely shrink, staying at 0.81–0.91 of their 1-hop size, and their 6-hop accuracy is 0.88–0.93. Why the loops' clocks hold up isn't tested; one guess is that their norms rescale the average. The comparison also crosses recipes: the one-layer model was trained on Nanda's recipe and the loops on the two-phase schedule, both for 20k steps.

### Observation 3: Compute Early, Read Late

The loops run their shared block 8 times, so we can stop them after any pass and ask two questions: does the model's output already give the right answer, and is the answer already in the state? For the second, I fit a linear probe<d-cite key="alain2016probes"></d-cite> from the state at `=`, the vector the unembedding reads, to the answer on half the chains, and score it on the other half.

{% include figure.liquid
   path="assets/img/recurrent-grokking/compute_early.png"
   class="img-fluid rounded"
   zoomable=true
   alt="Accuracy after each of 8 passes for three plain-loop runs. In two runs, a linear probe of the answer is at 0.7 to 0.93 from pass 1, while the model's own output stays near chance for the first few passes and only catches up at pass 6 or 7. In the seed-41 sandwich-norm run the probe rises later, from pass 3, but still ahead of the output."
   caption="Accuracy of a linear probe and of the model's own output after each pass, for the three plain-loop runs."
%}

In the figure, each run's probe is in colour and its output in grey, with 1-hop chains as filled circles and 3-hop chains as hollow squares; the dotted line is chance, 1/113. All three are final checkpoints, trained at 8 passes. The starred panel is the seed-41 sandwich-norm loop, the run without a clock.

In the plain loops, the answer is in the state long before the model outputs it. After a single pass at 1 hop, the probe reads the answer with 0.92 accuracy in the state-norm loop (seed 41) and 0.93 in the sandwich-norm loop (seed 42), while the model's own output is at chance. The output only catches up at pass 6 or 7.

More hops make the computation take longer, but not the output. From 1 to 3 hops, the first pass at which the probe reaches 0.9 moves 2–4 passes later (1 → 4, 1 → 5 and 4 → 6 in the three runs), while the output moves by at most one (6 → 6, 7 → 7 and 7 → 8). The output always arrives near the training depth of 8, whatever the chain length. So even though attention looks the same in every pass, the answer takes longer to form on longer chains; the loop doesn't do everything in its first pass.

The seed-41 sandwich-norm loop, the one without a clock, computes late too: its probe after pass 1 reads only 0.15 at 1 hop. But its probe still leads its output.

The Huginn-style loop is left out of the figure, since its probe and output are both at 0.97–1.00 from the first pass. That isn't because its loop is faster. Its prelude computes most of the answer before the loop starts (a probe right after the prelude reads 0.87 and 0.80 at 1 hop, at seeds 41 and 42), and its coda finishes it. As the next section shows, by the end of training it barely uses what it carries between passes.

This is a toy version of the internal monitoring the [essay](/blog/2026/recurrent-grokking-essay/) argues for: in the plain loops, a linear readout of the state sees the answer several passes before the model's output does. The probe only shows that the answer is linearly decodable from the state, not that the model uses it there, but for a monitor, being able to read it early is the point.

### Observation 4: How the Loops Use Their Depth

Every model here is accurate at 8 passes, the depth it's trained and evaluated at (for the Huginn-style loop, the mean of its sampled training depths). The differences show up when the loop runs longer than it was trained for, or when what it carries from pass to pass is replaced.

The plain loops break past their training depth. Their accuracy goes from 0.99–1.00 at pass 8 to 0.00–0.01 by pass 256 (the sandwich-norm loop at two seeds, the state-norm loop at one). In the sandwich-norm loop the state is unstable: a 1% nudge to it after pass 8 grows to the size of the state itself by pass 256. The answer appears near pass 8 and doesn't stay.

The two-phase Huginn-style loop holds: it's still at 1.00 at pass 256 at both seeds, and a 1% nudge to its state shrinks to almost nothing (below $10^{-8}$). It holds, but it has also stopped using its state. Replacing the carried state with fresh noise at every pass leaves its accuracy at 1.00 at both seeds, and the part of its input projection that reads the state has a spectral norm of only 0.06–0.07, against 0.43–0.71 for the part that reads the injected input. Zeroing the injected input instead collapses its outputs on 2-hop chains to one or two distinct answers. So by the end of training, each pass works only from the re-injected input, and every pass computes nearly the same thing.

That wasn't always true during training. At both seeds it still relied on its state at step 16,038, after the switch to clipping and learning rate decay (accuracy with noise as the state: 0.35 and 0.15), and it ignored the state by step 20,000. Before that, its reliance went up and down, and five checkpoints can't place the last change more precisely than "during the decay phase". At seed 42, the Huginn-style run that kept a constant learning rate is the same run until step 14k, and it ends training relying on its state (0.01 with noise as the state). That's a single pair, and clipping and learning rate decay switched on together, so I can't say which of them, if either, is responsible.

Accuracy at the training depth hides all of this. One loop's answer exists only around pass 8, and the other's doesn't depend on what it carries between passes. Checking a looped model's behavior at the depth it was trained at says little about what its loop is doing.

### Discussion

On a task with a one-pass shortcut, sharing a block across passes didn't produce a step-by-step algorithm. Every loop gathered its inputs with the same even average as the one-layer model, and every run but one read its answer off a clock like it. The extra depth still shows up, but in timing rather than in the algorithm: in the plain loops the answer is decodable early, takes longer to form on longer chains, and is read out near the training depth whatever the chain length. For monitoring, that cuts both ways. A linear probe of the state sees the answer passes before the output does, which is the kind of signal an internal monitor would look for. But accuracy at the training depth hid real differences in how the loops use their depth, and a behavioral check at that depth wouldn't have caught them.

This is one small task, with a shortcut the models can take, and small models. Most results are at two seeds, and the state-norm loop and the constant-learning-rate comparison are at one. There was no hyperparameter sweep. The plain and Huginn-style loops differ in several ways at once (prelude and coda, input injection, the random start, sampled depth and truncated backprop), so I can't say which of those causes which behavior, and the one-layer model was trained on a different recipe from the loops. A linear probe shows that the answer is decodable from the state, not that the model uses it. How the sum is computed before the readout, and why the loops' clocks don't dilute, are still open.

The natural next step is a task where the shortcut isn't available. Composing permutations in $S_5$ is the standard example: Liu et al.<d-cite key="liu2023shortcuts"></d-cite> show that, unless a widely believed complexity conjecture fails, a fixed-depth transformer can't solve it for arbitrarily long chains, so the depth a model needs grows with the chain. On related tasks, weight tying has been found to favor serial solutions<d-cite key="zhang2026convergence"></d-cite>, and looped models have been shown to spend successive passes on successive steps of the algorithm<d-cite key="sesodia2026insideloop"></d-cite>. Part 2 runs the same pipeline and probes there, to see whether the computation moves into the loop once the shortcut is gone, and whether the state still shows the answer before the output does.

__hey, what are you doing here! this is a WIP! come back later...__
