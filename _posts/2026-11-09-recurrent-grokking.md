---
layout: distill
title: On the Mechanistic Function of the Recurrent Block in Looped Transformers, Part 1
date: 2026-11-08
description: Results blog post for part 1 of a 2-part study on the nature of the computation that happens inside the looping component of a looped transformer, this time in a setting with a one-pass shortcut. Motivated by studying the impact of increased serial depth on monitorability; code for data and scripts for figures <a href='https://github.com/aopatric/recurrent-grokking'>here</a>.
authors:
  - name: Angel Patricio
    url: "https://aopatric.github.io"
    affiliations:
      name: Independent
tags:
categories:
bibliography: 2026-10-23-recurrent-grokking.bib
---

tl;dr: I compare toy-scale versions of several looped transformer variants (two plain looped transformers<d-cite key="dehghani2019universal"></d-cite> and one Huginn-style looped transformer<d-cite key="geiping2025huginn"></d-cite>) against a one-layer transformer baseline<d-cite key="vaswani2017attention"></d-cite>, trained on 1- to 3-hop addition chains mod 113 using the recipe from Nanda et al. (2023)<d-cite key="nanda2023progress"></d-cite> with gradient clipping and learning rate decay added late in training to address the observed training instability. I study the mechanistic function of the recurrent block, comparing how their learned behavior aligns with the canonical "clock" characterization<d-cite key="nanda2023progress,zhong2023clock"></d-cite>. I find that none of the loops learn to perform add sequentially, instead using even attention to aggregate information on the inputs before reading out the answer. All but one run shows signs of clock-like readout, and the looped models that learned this approach held up better on longer chain lengths of up to 6 hops (though the one-layer model stayed on Nanda's recipe). I also find that for plain loops, the answer can actually be decoded linearly from the hidden state with a simple probe<d-cite key="alain2016probes"></d-cite> on the representation before the model's own decoder stack can read out the answer. This pattern decreases in strength as hop count is increased, but the probe remains at least 2 passes early relative to the output layer in all plain looped trials at all training hop counts. The results motivate some discussion and a note that accuracy at training depth fails to capture the vastly differing uses of the recurrent block when used as a measured performance metric; plain loops break when ran beyond their training depth and the Huginn-style loop even began ignoring its hidden state by the end of training, reading only from the input injection.

This work is accompanied by an actively in-progress part 2, in the form of a contrasting study of a task where there exists no one-pass shortcut. Additionally, the observations motivate further exploration into developing monitoring tools for understanding _both_ the __intra- and inter-token computation__<d-cite key="skye2026shadow"></d-cite> in not just looped transformers but, broadly speaking, the deep learning architectures of the future.

<small>
(A note from me: this project was heavily compute-limited; mechanistic results are verified at two seeds unless otherwise noted, but training ablations were mostly run on a single seed with a few key baselines repeated on a second. There was no full hyperparameter sweep; I comment on the confidence of each result in the prose.)
</small>

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

Below are overviews of my four major observations from mechanistic analysis on this problem setting. I organize them by topic for clarity, and the first three each get an accompanying figure.

### Shortcuts and Attention Averaging

The attention map is one of the key sources from which we can infer how these simple transformers operate on their inputs. Generally, this comparison seeks to identify whether the loops read the chain _sequentially_ (i.e., one operand at a time, left-to-right or vice versa), or in _parallel_. In a model computing partial sums _sequentially_ (the kind of pass-by-pass algorithm looped models can implement<d-cite key="saunshi2025latent"></d-cite> and have learned on other tasks<d-cite key="sesodia2026insideloop"></d-cite>), we would expect an attention pattern that attends to a different operand each pass. On the other hand, one that reads the chain in _parallel_ would have an attention map that looks roughly the _same_ across passes.

The figure below shows the attention patterns from the `=` token in each model, for each head, averaged over 1,000 chains each at 3 and 6 hops, from the first pass of each block (seed 41). In this graphic, we can observe that attention from `=` is about even in every block and head. The other passes collected on hop counts from 1 to 6, including those on seed 42, share the same pattern. The largest gap from an even split is at most 0.025 in the looped models displayed, and the normalized entropy is 0.999 or higher. This isn't unique to the `=` token, either: every token position averages evenly over its previous tokens. The one-layer model spreads its attention evenly over the operands too, so the loops gather their inputs the same way as the model whose algorithm we are treating as ground truth. An interesting but as of yet unexplained detail is that some of the one-layer model's heads learned to _ignore_ the `=` token itself (2 of 4 heads at seed 41 and 3 of 4 at seed 42, with 0.01–0.04 of the weight at 6 hops).

{% include figure.liquid
   path="assets/img/recurrent-grokking/attention.png"
   class="img-fluid rounded"
   zoomable=true
   alt="Heatmaps of attention from the = token to each token of the chain, per head, for the one-layer model, both plain loops and the Huginn-style loop, on 3-hop and 6-hop chains. Every loop's weights are even: 0.20 at 3 hops and about 0.12 at 6 hops. The one-layer model's are even over the numbers, with two heads nearly skipping the = token."
   caption="Attention from <code>=</code> to each token, per head, in each model's first pass (for the loops, the shared block's first pass). Averaged over 1,000 chains at 3 and 6 hops."
%}

The observed pattern suggests that the recurrent blocks, in this context, do _not_ read in operands left-to-right, but instead gather them all at once: the one-pass shortcut from the foreword. At each pass, every position adds an even average of the tokens it can see to its own state, plus any injected information, and the MLP works from there. The natural follow-up is to ask what they compute with this representation.

### Clock-Like Readouts

We've established that attention gathers an even average of the input tokens' representations at each pass. The question is: how does the model turn that into an answer? We can once again compare the behavior to our ground truth. Nanda et al.'s one-layer model reads its answer from a clock<d-cite key="nanda2023progress,zhong2023clock"></d-cite>: the logit for each candidate answer $c$ is a sum of $\cos(w(a+b-c))$ over a few key frequencies $w$, an expression which peaks at the correct answer. To compare, I fit the same form to the logits of each model on the 1-hop grid, asking how much of the output is explained by these key frequencies.

The figure below shows this comparison in three ways, using the final checkpoint from each run. The first panel compares the Gini coefficient of each model's (un)embedding matrices over the 56 frequencies, a metric meant to measure how _concentrated_ the information is among a few key frequencies; the Gini coefficient is one of the sparsity measures the original work tracks during grokking<d-cite key="nanda2023progress"></d-cite>. The second chart shows the proportion of the logits' variance explained by the top $k$ frequencies. The third chart measures Nanda et al.'s excluded loss: the loss on the training pairs after removing the top $k$ frequencies from the logits. In each chart, a dotted line marks the chance level for comparison (a random matrix, a readout with no clock, and a uniform guess, respectively).

{% include figure.liquid
   path="assets/img/recurrent-grokking/clocks.png"
   class="img-fluid rounded"
   zoomable=true
   alt="Three panels. Left: bars of how concentrated each run's embedding and unembedding are over frequencies; the unembedding is more concentrated in every run but the seed-41 sandwich-norm loop. Middle: the share of logit variance explained by the top k frequencies, which levels off near 5 frequencies for the one-layer model and near 20 for the loops, while the seed-41 sandwich-norm loop stays close to chance. Right: the loss after removing the top k frequencies, which rises toward a uniform guess by about 20 frequencies for the loops."
   caption="Three measures of how clock-like each run's readout is, on the 1-hop grid."
%}

First, some observations about sparsity. The chart shows that sparsity in the (un)embedding matrices of the looped models is comparable to that of the one-layer model, and that in every run but one, the readout (unembedding) matrix is sparser than the embedding matrix: a Gini of 0.43–0.48 against 0.17–0.32, where a random matrix gives 0.02.

The variance-explained chart tells a similar story. By $k=5$, the one-layer model reaches an $r^2$ of 0.84–0.88. The looped models reach a similar value (0.86–0.94) at around $k=20$. Despite the large increase in key frequencies, the variance explained by these core frequencies is still well above chance (about 0.36 at $k=20$).

We can combine these observations with those from the excluded-loss graphic to put together our understanding of these models' behavior. The one-layer model is the clearest outlier in this graphic: removing its 5 key frequencies shoots its loss far past a uniform guess, to 13.5 at seed 41 (literally off the chart) and 6.8 at seed 42. That overshoot comes from the scale of its logits, which stay large and confidently wrong once the clock is gone, not from a bigger clock. The looped models need more frequencies removed: by $k=20$, their loss has risen to 3.6–4.3, close to a uniform guess's 4.73, and none of them overshoots the way the one-layer model does. Either way, removing the clock removes the answer, so the clock carries the answer rather than just fitting the logits.

The one exception to all of these trends is the seed-41 sandwich-norm loop. Its unembedding is barely sparse at all (a Gini of 0.09, against 0.43–0.48 for the rest), its top frequencies barely beat a readout with no clock (0.40 against 0.36 at $k=20$), and its excluded loss stays near zero past $k=20$ and is only 1.56 at $k=40$, tracking the no-clock readout's. It also doesn't extrapolate to 6 hops. Its seed-42 twin _does_ exhibit clock-like behavior, so which solution the sandwich-norm loop finds depends on the seed. One concrete difference between the two: the seed-41 run grokked late, at step 18,800, after the switch to clipping and learning rate decay, while its twin grokked at step 8,000. Whether that's why it found a different solution is untested.

A final note about signal dilution: a clock read from a direct average would shrink in amplitude to about 0.38 times its 1-hop amplitude at 6 hops. The one-layer model's clock shrinks a little more than that, to 0.28–0.30x, and its 6-hop accuracy is 0.60 and 0.79 (seeds 41 and 42). The looped models' clocks only shrink to 0.81–0.91x, and they keep more of their accuracy (0.88–0.93 at 6 hops). One caveat: this comparison crosses recipes, since the one-layer model was trained on Nanda's recipe and the loops on the two-phase schedule.

These observations allow us to paint a clearer picture of the differences in computation going on. For one, we can say that the learned algorithm can be seed-dependent, which echoes Zhong et al.'s finding that small changes to hyperparameters and initializations are enough to drastically change the learned algorithm<d-cite key="zhong2023clock"></d-cite> (they even study this same task). In our case, changing the seed alone was enough to change the learned behavior, though it is still unclear what shape this new behavior takes. Otherwise, it seems that the looped models take a similar approach to the one-layer model: they read their answer from a clock as well, just one spread over many more frequencies and seemingly more robust to longer inputs. However, some additional differences stop me from claiming this is the same manner of computation as in the progress measures paper. Most MLP neurons are _not_ explained by a single frequency (in any block or pass, at most 6% get more than 85% of their variance from one), and the embeddings lean toward the readout's key frequencies far less sharply than the unembedding does (58–85% of their squared norm sits on the readout's top 20 frequencies, against 36% if it were spread evenly). The clock structure gives us some information about the _approach_, but these experiments leave unclear how the model goes from the averaged inputs to the clock.

That brings us back to the purpose of this project, laid out in the [accompanying essay](/blog/2026/recurrent-grokking-essay/): studying the impact of architecture on monitorability<d-cite key="korbak2025monitorability"></d-cite>, i.e., how well we can understand what is happening inside a model beyond what it outputs. One question in that direction is timing: can we pull the answer out of the model's internals before the model outputs it itself?

### Compute Early, Read Late

To answer that question, we can study how well a linear probe<d-cite key="alain2016probes"></d-cite> is able to predict the answer from the hidden state, compared to the model's own output layer(s), at any given pass. At each pass, a probe is fitted from the state at `=` in the plain looped models to the answer on about half of the chains, while being scored on the other half. The resulting comparison is illustrated below, with the probes in color and the model output in grey.

{% include figure.liquid
   path="assets/img/recurrent-grokking/compute_early.png"
   class="img-fluid rounded"
   zoomable=true
   alt="Accuracy after each of 8 passes for three plain-loop runs. In two runs, a linear probe of the answer is at 0.7 to 0.93 from pass 1, while the model's own output stays near chance for the first few passes and only catches up at pass 6 or 7. In the seed-41 sandwich-norm run the probe rises later, from pass 3, but still ahead of the output."
   caption="Accuracy of a linear probe and of the model's own output after each pass, for the three plain-loop runs. Dotted line is 1/113, or chance for this task."
%}

From the graphic, we can tell that the plain loops hold their answer in their hidden state multiple steps before the model outputs it. After a single pass on the 1-hop grid, the probe is able to read the answer with 0.92 accuracy in the state-normalized loop (seed 41) and 0.93 in the sandwich-norm loop (seed 42). The model's own output at this point for both runs is at around chance accuracy. So, to answer the question: in the plain loops, a linear readout of the state sees the answer several passes before the model's own output does. The probe only shows that the answer can be decoded from the state, not that the model uses it there, but for a monitor, being able to read it early is the point.

A note: the starred chart above is the sandwich norm trial on seed 41, which did not exhibit clock-like readout behavior. Interestingly, its probe still leads its output, although it computes later (0.15 after one pass at 1 hop) and with a shorter lead: about 3 passes (the probe reaches 0.9 at pass 4 and the output at pass 7), against 5–6 for the other two runs.

Another observation: on longer chains, the probe takes more passes to reach the same accuracy, while the output's timing barely changes. From 1 to 3 hops, the first pass with a probe score of at least 0.9 moves 2–4 passes later. The output, on the other hand, moves by at most one. In all three plain-loop runs, the output arrives near the training depth of 8. A key takeaway: although the attention is even on every pass, the answer takes longer to form on longer chains. The loop itself does not complete the computation in one pass every time.

The Huginn-style comparison is left out of the figure intentionally since both its probe and output accuracies are around 0.97–1.00 from the first pass. Analysis showed that the Huginn-style loop's prelude (the additional non-looping layers before the core) computes most of the answer _before the loop even starts_ (a probe placed after the prelude read 0.87 and 0.80 at 1 hop on seeds 41 and 42). Similarly, I observed that the coda (the non-looping layers _after_ the core) finishes the computation and readout. As the next section shows, by the end of training the Huginn-style loop barely uses what it carries between passes.

### On the Function of Depth

The readout from the plain loops reaches near-100% accuracy at the training depth of 8 passes, and, as we observed in the previous section, it arrives there regardless of the length of the chain. The question is, what is the model actually doing with the extra computation it gets from iterating? A central promise of looped transformers is a dial we get to turn which governs the amount of computation per forward pass<d-cite key="geiping2025huginn,zhu2025ouro"></d-cite>. This only really makes sense if the underlying computation builds on the previous state, and if running it indefinitely does not cause collapse. This final comparison studies these properties using some simple experiments: running the loop past training depth (up to 256 passes), replacing the state carried between passes with noise, and zeroing the injected input. A note that governs the shape of these results: the plain looped models do _not_ get input injection, so their initial reading is their only interaction with the original input embeddings, and they train at exactly 8 passes. The Huginn-style models get their prelude's output re-injected every pass and train at sampled depths (median 8). For the same reason, the last two experiments only apply to the Huginn-style loop: a plain loop has no injected input to zero, and its state is its only copy of the input, so replacing it would trivially destroy the answer.

Running models past their training depths reveals a clear separation in these two approaches: _plain loops break beyond their training depth_. In my trials, accuracy fell from 0.99–1.00 at pass 8 to 0.00–0.01 at pass 256 (from the plain loop with sandwich norms on two seeds, and the state-normalized loop on one). The sandwich norm design proved to be particularly unstable, with a 1% nudge after pass 8 growing to a deviation the size of the state itself by pass 256.

However, this quality degradation is _not_ purely caused by instability. The state-normalized model does not experience the same growth when nudged after pass 8, yet the accuracy drops by just as much. This suggests that the issue is not necessarily that the models are _too unstable_ to survive for more passes, but rather that the answer may _only exist_ around the training depth.

Interestingly, the two-phase Huginn-style loop held notably well. It held an accuracy of 1.00 at 256 passes, and the same 1% nudge after pass 8 shrank to below $10^{-8}$. It also reaches 95% of its best accuracy within 1–2 passes. In the ablation replacing its carried state with noise, accuracy was still 1.00 at both seeds, and its weights agree: the part of its input projection that reads the state has a spectral norm of only 0.06–0.07, against 0.43–0.71 for the part that reads the injected input. This key detail implies that the model has learned to not rely on the information carried in its hidden state at all, rather using the re-injected prelude output as the grounds for its prediction. Zeroing the injected input collapses the model's outputs on 2-hop chains to 1–2 distinct answers, suggesting that each pass is indeed recomputing the same answer from the input. This is a property of this training run, not of the architecture: the same model still relied on its state at step 16,038 (accuracy with noise as the state: 0.35 and 0.15 at seeds 41 and 42), and at seed 42 its constant-learning-rate twin ends training relying on it (0.01).

The implication here is that measuring accuracy at the training depth can be misleading, hiding two opposite failure modes in these experiments: one design relies almost entirely on looping, but does not hold its answer past the training depth; the other is stable, yet doesn't do anything with its hidden state. Both report the same accuracy at training depth, and neither iterates in a way that would benefit from greatly increased test-time computation.

### Discussion

On a task with a potential one-pass shortcut, looping alone didn't produce a step-by-step algorithm, or one that improves with more passes. Instead, every loop gathers its inputs with one even average, the same way the one-layer model does, and all but one run learned to read its answer off a clock like the one-layer model's. The exception seems seed-dependent. In the plain loops, the answer can be linearly decoded from the hidden state several passes before the model's own output gets it right. Plain loops lose their ability to give correct answers beyond the training depth, and the Huginn-style loop can even learn to ignore its hidden state entirely.

Still, there are positive signals for monitoring internal computation: since the probe reads the answer from the state passes before the output does, a monitor reading the state could see an answer before the model commits to it, and further work could identify better ways of capturing that signal. Some bad news: simple metrics like accuracy at the training depth fall short of predicting important nuances about model behavior, like how stable an answer is or how the loops are used internally. Here, those only showed up once we perturbed the model (running it past its depth, replacing its state). What a loop does also isn't fixed by its architecture: the readout changed with the seed, and reliance on the state changed over training. A few caveats are in order. This was a small algorithmic task with a known shortcut, I trained relatively tiny models, most results are at two seeds (some at one), and there was no hyperparameter sweep. The loop designs also differ in several ways at once, so I can't say which difference causes which behavior, and the one-layer model was trained on a different recipe (Nanda's, not the two-phase schedule).

This investigation leaves behind plenty of open questions for follow-ups, some of which Part 2 takes on. For one, we've yet to uncover why the answer forms over more passes on longer chains, and where that refinement happens: attention over states that change every pass, or the MLP. Patching pass 1's attention into later passes and ablating the MLP pass by pass could separate the two. Another is why the loops' clocks don't seem to suffer the same dilution as the one-layer model's. Part 2 seeks to address some of the limitations of this project by studying these same architectures on a task where no fixed-depth shortcut is believed to exist, composing permutations in $S_5$ (inspired by Liu et al.<d-cite key="liu2023shortcuts"></d-cite>). Once the shortcut is gone, the question is whether the computation is forced into an iterative shape within the model, and whether the state still shows the answer before the output does.

At toy scale, then, the state carried an early, readable signal of the answer, but only perturbing the model showed what its loop was actually doing; an internal monitor for looped models could need _both_.
