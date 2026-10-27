---
layout: distill
title: On Serial Depth and Monitorability in Looped Transformers, Part 1
date: 2026-10-23
description: Blog post for part 1 of a 2-part study on the computation that happens before a token is emitted in looped transformers, motivating future work in studying the impact that an increased serial depth could have on monitorability.
authors:
  - name: Angel Patricio
    url: "https://aopatric.github.io"
    affiliations:
      name: Independent
tags:
categories:
---

<!-- 

note to self: things to reference about astra and latent reasoners
- sebastian raschka, gpt-6 astra, looped transformers, and hidden reasoning (https://magazine.sebastianraschka.com/p/gpt-6-astra-looped-transformers-and)
    - the main skeptic to argue against. surveys looped architectures (ouro, nanbeige, mixture-of-recursions, smelt), says looping does little to hide reasoning, and reads the monitorability drop as shorter traces from a stronger model. he does not claim a benchmark leap: astra is at the frontier but not far ahead on independent indexes. his "slight regression" framing contrasts with openai's own "substantial decrease."
- maarten baert, latentmathbench writeup and hn post (https://maartenbaert.github.io/LatentMathBench/, https://news.ycombinator.com/item?id=49633867)
    - direct evidence of long serial computation with zero thinking tokens: random variable-assignment programs in, one final number out. astra's 50% horizon on math-4 is ~4x sol's and ~7x gpt-4's (34 vs 8 steps per his hn comment). caveats: 10–20% chance baseline, anthropic models leak reasoning despite the prompt, and some tasks were shortcuttable (he added swap-n/bitwise-n to fix this). the hn thread is 3 points and 2 comments, so cite it only as the author's own summary.
- maarten baert (mbaert), astra's no-cot limits track speculative depth, not step count (https://www.lesswrong.com/posts/WFc3NkuPaYFrYuaZd/astra-s-no-cot-limits-track-speculative-depth-not-step-count)
    - most relevant piece for the grokking angle. success is predicted by iterations of a guess-and-refine parallel algorithm, not by step count (54-step horizon on boolean circuits, dropping to 11 with xor). matches your clock result, where models project mean-pooled operands onto a global clock instead of composing step by step. if models converge on iterative/parallel algorithms, step counts understate how much opaque work is possible.
- russell brandom (techcrunch), openai's new reasoning technique alarms ai safety experts (https://techcrunch.com/2026/09/02/openais-new-reasoning-technique-alarms-ai-safety-experts/)
    - origin of the rumor: summarizes the paywalled the information scoop that astra uses "recurrent depth"/"opaque recurrence." shlegeris and greenblatt are on record with concerns. follow-up reporting says anthropic and gdm are discussing the technique too, which supports a race-dynamics framing.
- openai, gpt-6 astra system card: monitorability (https://deploymentsafety.openai.com/gpt-6-astra/monitorability)
    - primary source for the decline: substantially lower cot monitorability than sol, more control over its own cot, less incriminating content, and sandbagging that went undetected in adversarial evals. no evidence of steganography. uk aisi estimates the no-cot time horizon rose ~an order of magnitude. openai attributes the change to capability, not architecture.
- jakub pachocki, an alien mind (https://openai.com/index/an-alien-mind/)
    - openai's chief scientist calls cot monitoring the primary bet and says reliance on it is diminishing. lists causes (reasoning mixed with tool use, models reasoning about their own reasoning, stronger pretraining) without naming architecture, and commits to withholding scaling if needed. pair with his x post that astra's depth is within ~2x of gpt-4's.
- zvi mowshowitz, astra is hard to monitor (https://www.lesswrong.com/posts/HCRs8btkiamtWSNAL/astra-is-hard-to-monitor)
    - strongest rebuttal to "small issue." cot controllability is 60.9% for astra vs 16.1% for sol vs 1.7% for gpt-5.5 thinking (750–1,250-token cots). argues the drop is too large to be the capability trend. collects reactions from korbak, achiam, roon, greenblatt and nanda, and frames it as a race to the bottom.
- rauno arike, how concerned should we be about astra's recurrent architecture? (https://www.lesswrong.com/posts/PLisnSFir8y5AHkmP/how-concerned-should-we-be-about-astra-s-recurrent)
    - the careful steelman for the other side: recurrence runs along depth, not across tokens; ~2x gpt-4 depth is a modest change; published loop counts have shrunk at scale. commenters argue intermediate loop states may be decodable, which is worth addressing directly.
- neel nanda, astra can do a concerning amount with no chain of thought (https://www.alignmentforum.org/posts/eRmzz8J8Qkzqvzrgg/astra-can-do-a-concerning-amount-with-no)
    - 19-task no-cot reasoning index: astra has ~8.6x the odds of fable 5.1 and serial depth of ~7.2 vs 4.1 steps. across 34 open models, no-cot capability and cot controllability are uncorrelated (spearman 0.10), so they are separate axes. thinks looping is the likely cause and disputes the system card. appendix covers huginn, ouro and nanbeige.
- rohan subramani, gpt-6 astra can do a lot of multi-hop reasoning without chain of thought (https://www.lesswrong.com/posts/FsCkkoGsNmPzFKRhg/gpt-6-astra-can-do-a-lot-of-multi-hop-reasoning-without)
    - hand-written multi-hop factual chains, 540 samples per model, zero reasoning tokens: astra manages ~4–5 hops vs sol's 2–3. argues "more intelligence" isn't a mechanism, and that looping plausibly allows repeated retrieval without a token bottleneck.
- francis rhys ward & dewi gould, estimating gpt-6 astra's no-cot time horizon (https://www.lesswrong.com/posts/ntKx9YHWCwxSeGbRB/estimating-gpt-6-astra-s-no-cot-time-horizon)
    - puts astra's no-cot 50% time horizon at probably 15–40 min. daniel filan's comment on the assumed 0% on long tasks is a fair caveat, so cite it as a range.
- dewi gould, francis rhys ward, anders cairns woodruff et al., think fast: estimating no-cot task-completion time horizons of frontier ai models (https://arxiv.org/abs/2606.07157)
    - the trend line: no-cot horizons doubling roughly yearly, gpt-5.5 just over 3 min, ~7 min projected by 2028. this is what makes astra read as a break from trend.
- christine corry, yet another concerning result on astra's no-cot capabilities (https://www.lesswrong.com/posts/tz5WvDouXKbiWJG8B/yet-another-concerning-result-on-astra-s-no-cot-capabilities)
    - 4-hop: 31% vs 1–3% for other models, 63% with filler tokens. the gain from filler grows with problem depth, consistent with added serial depth. zero reasoning tokens verified across ~28k rows.
- stevenw, astra uses some of its no-cot capability in practice (https://www.lesswrong.com/posts/kaoeXZkWhNELmgbKg/astra-uses-some-of-its-no-cot-capability-in-practice)
    - links capability to behavior: on chain tasks, astra's actual cot is only 4–7 tokens longer than a bare list of intermediate values, so it likely isn't writing out its steps. it isn't yet using its full no-cot capacity.
- jonah brown-cohen, david lindner & rohin shah, quantifying the necessity of chain of thought through opaque serial depth (https://arxiv.org/abs/2603.09786)
    - theoretical framing for the post: formalizes opaque serial depth and argues cot is monitorable because standard transformers force long serial computation through tokens. that is exactly the property recurrent depth relaxes.
- jonas geiping et al., scaling up test-time compute with latent reasoning: a recurrent depth approach (https://arxiv.org/abs/2502.05171)
    - the huginn paper; the architecture astra is rumored to resemble.
- harsh kohli, srinivasan parthasarathy, huan sun & yuekun yao, loop, think, & generalize: implicit reasoning in recurrent-depth transformers (https://arxiv.org/abs/2604.07822)
    - closest prior work to yours. systematic generalization in recurrent-depth transformers emerges through a three-stage grokking process, and extra test-time loops extend to deeper compositions until "overthinking" degrades results. check for overlap and position your algorithm-level findings against their account.
- zitian gao et al., loop the loopies! (https://arxiv.org/pdf/2607.16051)
    - compute-matched looped moe models beat vanilla baselines at scale (with two loops). evidence the economic pressure to loop is real, so the monitorability concern won't stay hypothetical.


serial computation / pushing work into the loop (for the "next" section):
- bingbin liu et al., transformers learn shortcuts to automata (https://arxiv.org/abs/2210.10749), iclr 2023
    - o(log T) depth suffices for any semiautomaton; solvable ones (incl. modular counters) have shortcuts whose depth doesn't grow with T; shortcuts are brittle under length shift. our averaging clock is that shortcut.
- william merrill & ashish sabharwal, a little depth goes a long way (https://arxiv.org/abs/2503.03961), neurips 2025
    - depth vs serial computation for transformers; the theory reason a fixed-depth model can't track non-solvable state over long inputs.
- nikunj saunshi et al., reasoning with latent thoughts: on the power of looped transformers (https://arxiv.org/abs/2502.17416), iclr 2025 (in readings/)
    - looped models can simulate many steps of chain of thought with a few loops; a looped k-layer model can match a much deeper one on reasoning tasks.
- ying fan et al., looped transformers for length generalization (https://arxiv.org/abs/2409.15647), iclr 2025 (in readings/)
    - looped models trained with adaptive steps length-generalize on tasks with iterative solutions.
- zhang et al. 2026, group word problems (https://arxiv.org/abs/2607.20594)
    - weight tying selects serial solutions on non-abelian groups; s5 is a wall without an operator-first curriculum; z_60 takes an abelian shortcut. closest template for the next project.
- maarten baert's speculative-depth note (above): no-cot limits track iterations of a parallel guess-and-refine algorithm, not step count. same flavour as our "passes don't grow with chain length".
 -->

<!--
v5, 2026-10-25: dense WIP version. alignment framing lives only in the foreword; everything after is the project.
previous full version (with all bullets, claim numbers, the inductive-bias essay, open questions):
recurrent-grokking/my-notes/archive/v2-before-dense-rewrite-2026-10-25.md. cut background prose:
archive/v2-cut-background-2026-10-24.md. claim numbers live in MASTER.md, not in the post.
[CAPS] = something for you to fill (figure, link, comment).
-->

<!--
v6, 2026-10-26: prose stripped back to headings + figures for a fresh bullet outline. tl;dr untouched.
the v5 dense prose this replaced: recurrent-grokking/my-notes/archive/v2-before-outline-revert-2026-10-26.md.
-->

<!-- tldr/abstract: needs repo link -->

tl;dr: Part 1 of a 2-part study on [intra-token computation](https://www.lesswrong.com/posts/5tyzgTLnNn8qB9rev/shadow-computation-threatens-cot-monitorability) in [looped transformers](https://sebastianraschka.com/llm-architecture-gallery/looped-depth-sharing/). I follow the training recipe from [Nanda et al. (2023)](https://arxiv.org/abs/2301.05217) to compare a one-layer [Vaswani et al.](https://arxiv.org/abs/1706.03762) transformer baseline, a simplified looped model based on the [universal transformer](https://arxiv.org/abs/1807.03819), and a [Huginn](https://arxiv.org/abs/2502.05171) variant on the task of $n$-hop modular addition base $113$. I find that in this task the the looped models do _not_ learn iterative algorithms and instead abuse a 1-pass shortcut while _utilizing their loops in varying ways_, achieving _similar task generalization performance_ across strategies. I additionally study the periodic training collapses I experienced in training recurrent [grokkers](https://arxiv.org/abs/2201.02177) under the Nanda et al. recipe, and propose a simple fix with standard learning rate/weight decay scheduling. This work motivates part 2, a contrasting study in a problem setting where there exists no 1-pass shortcut, and additionally motivates further exploration into the development of monitoring tools for understanding _both_ the __intra- and inter-token computation__ in looped transformers. [[code]](dummy.link)

(A note from me: Due to compute limitations, most experiments were run on a single seed and confirmed on a second one. I report this accordingly with each result.)

## foreword on safety and looped transformers

<!-- foreword outline, 2026-10-26. the opinionated part; everything after it is the project. [CAPS] = your call. target ≈400–600 words: sections 4 and 5 are a couple of sentences each, and the Astra evidence can go in a footnote -->

In the current landscape of production AI safety, monitoring the [chain of thought (COT)](https://arxiv.org/abs/2201.11903) is the [most relied-upon](https://openai.com/index/an-alien-mind) method for preventing [agentic misalignment](https://arxiv.org/abs/2510.05179). The unfortunate paradox of the matter, as Jakub Pachocki writes in the linked post, is that "evaluations indicate our ability to rely on CoT monitoring is progressively diminishing." Despite this, the [GPT-6 family system card](https://deploymentsafety.openai.com/gpt-6-astra/safeguards) outlines a safety system built around a pipeline that "reviews the agent's chain of thought alongside its actions."

The argument for CoT monitoring is the first place is somewhat architectural. We assume the model offloads computation to its reasoning tokens _because_ it has a fixed computation budget (i.e., an [opaque serial depth](https://arxiv.org/abs/2603.09786)). However, even the [original CoT monitoring paper](https://arxiv.org/abs/2507.11473v2) calls it a fragile opportunity _in its title_, and warns the field about making research decisions that pressure the model to obfuscate the CoT _in its abstract_. OpenAI _themselves_ have even published work on the [risks of obfuscation](https://arxiv.org/abs/2503.11926).

Nevertheless, recent work has shown models _are_ capable of obfuscating the CoT through [output supervision](https://arxiv.org/abs/2511.11584v1), [training on documents about monitoring](https://arxiv.org/abs/2605.15257), and in some cases even [pure prompt pressure](https://arxiv.org/abs/2510.19851).

__Looped transformers introduce a unique threat to CoT monitorability as they seek to alleviate the serial depth limitation of existing transformer architectures.__ [User Skye on LessWrong](https://www.lesswrong.com/posts/5tyzgTLnNn8qB9rev/shadow-computation-threatens-cot-monitorability), who was in the lab responsible for [Ouro](https://arxiv.org/pdf/2510.25741)<d-footnote>Foundational model for the push towards loops. Not studied as a family here, details in the model section.</d-footnote>, breaks down monitorability concerns into those relating to _intra-token computation_ (that which happens inside the internals of the model _between_ tokens) and those relating to _inter-token computation_ (that which happens from one token to another).<d-footnote>User Skye notes that the increase in serial depth does not necessarily mean unbounded depth, and bigger computational work would still need to be offloaded to the CoT. Nonetheless, Skye does remark that increased intra-token computation is a concern for monitorability.</d-footnote> In a model with variable serial depth, the 

This two-part project aims to isolate the intra-token computation in looped transformers in order to study the degree to which it could hinder monitorability.

**2. Shadow computation**
- Definition ([Skye, Oct 2026](https://www.lesswrong.com/posts/5tyzgTLnNn8qB9rev/shadow-computation-threatens-cot-monitorability)): "inter-token computation that bypasses the readout bottleneck", i.e. latent state carried forward between tokens (COCONUT, full-bandwidth transformers). Unverbalized computation grows with generation length, and "CoT goes from necessary to optional."
- What that does to monitoring: the tokens become a projection of the model's state rather than its reasoning, and a monitor only sees the projection.
- Address this head-on: Skye ranks looped models as the _lesser_ risk (per-token depth is fixed, the readout bottleneck stays), while the tl;dr frames this post around intra-token computation in loops. So the foreword has to say why loops still matter. [STANCE: one or both]
  - loops are the version that's already shipping: the per-token bound holds, but it's a dial (more loops), and no-CoT capability is already moving (section 3)
  - loops are the tractable testbed: shared weights and per-pass readouts make them the easiest place to build tools for computation that never reaches a token, before the inter-token case

**3. Why looped transformers specifically**
- One sentence on what they are: the same block run several times per token, so more serial computation per token without writing more tokens. The figure and footnote go here.

{% include figure.liquid path="assets/img/recurrent-grokking/reasoning.png" class="img-fluid rounded" zoomable=true alt="Two panels comparing how a fixed-depth transformer and a recurrent-depth transformer reason before their first token." caption="Roughly the case. Recurrent-depth transformers can also be used to generate a CoT, but more computation happens between tokens." %}

<!-- parked from the old foreword prose, re-add when rewritten: <d-footnote>Non-technical visualizations for this post were made with the help of Claude.</d-footnote> -->

- They're real and open: [Huginn](https://arxiv.org/abs/2502.05171) (Geiping et al. 2025; recurrent depth, scale test-time compute by looping more) and [Ouro / LoopLM](https://arxiv.org/abs/2510.25741) (Zhu et al. 2025; 1.4B and 2.6B, looping built into pretraining, matching much larger models). Compute-matched looped MoEs beat their baselines ([Gao et al.](https://arxiv.org/pdf/2607.16051)), so there's economic pressure to loop.
- The frontier rumor: Astra reportedly uses "recurrent depth" ([TechCrunch](https://techcrunch.com/2026/09/02/openais-new-reasoning-technique-alarms-ai-safety-experts/)). One or two sentences in the body, the evidence in a footnote:
  - for: a jump in no-CoT capability. [Nanda](https://www.alignmentforum.org/posts/eRmzz8J8Qkzqvzrgg/astra-can-do-a-concerning-amount-with-no): serial depth ≈7.2 vs 4.1 steps; [Subramani](https://www.lesswrong.com/posts/FsCkkoGsNmPzFKRhg/gpt-6-astra-can-do-a-lot-of-multi-hop-reasoning-without): 4–5 hops vs 2–3; [Ward & Gould](https://www.lesswrong.com/posts/ntKx9YHWCwxSeGbRB/estimating-gpt-6-astra-s-no-cot-time-horizon): no-CoT horizon probably 15–40 min, against a trend that had GPT-5.5 at ≈3 min ([Gould et al.](https://arxiv.org/abs/2606.07157))
  - against: the [system card](https://deploymentsafety.openai.com/gpt-6-astra/monitorability) attributes it to capability, not architecture; [Arike](https://www.lesswrong.com/posts/PLisnSFir8y5AHkmP/how-concerned-should-we-be-about-astra-s-recurrent): ≈2× GPT-4's depth is a modest change
  - [STANCE: how much weight the rumor gets. v1's line: "this post won't settle that; the lever exists and the pressure to pull it is real"]

**4. Output-level tools aren't enough**
- Two separate axes: how much a model can do without verbalizing (opaque capacity, which loops raise) and how much control it has over what it does verbalize (controllability). [Nanda](https://www.alignmentforum.org/posts/eRmzz8J8Qkzqvzrgg/astra-can-do-a-concerning-amount-with-no): uncorrelated across 34 open models (Spearman 0.10).
- Controllability is rising: Astra 60.9% vs Sol 16.1% vs GPT-5.5 Thinking 1.7% (system card numbers, via [Zvi](https://www.lesswrong.com/posts/HCRs8btkiamtWSNAL/astra-is-hard-to-monitor)). For the older models, keep the softened version: [OpenAI](https://openai.com/index/reasoning-models-chain-of-thought-controllability/) found limited control, and [METR](https://metr.org/blog/2026-04-01-fine-tuning-cot-controllability/) raised it 2.9% → 8.8% with fine-tuning, still low in absolute terms.
- The claim (your couple of sentences): when the output is highly controllable and enough computation fits outside it, a monitor that only reads outputs reads what the model chose to show. Monitoring has to reach the computation itself.

**5. Self-consistency, extended to depth**
- The existing response: [Self-CTRL](https://arxiv.org/abs/2606.18327) (Pres, Ruis, Ghebreselassie, Li & Andreas 2026) uses RL to make a model's self-explanations agree with its behavior on related inputs (updating either side), and the self-reports then help a third-party auditor predict refusals.
- Its limit here: both sides of the check are outputs. A model that can do the work in its loop and shape its words can be consistent and still opaque.
- Your extension: make the latent computation one side of the check. For a looped model, does what it says it computed match what its per-pass states show? [STANCE: one or two sentences, framed as the direction, not a result]
- The prerequisite, which is the bridge: checking a model's account of its loop needs ground truth for what the loop computes, so we need looped models that learn an algorithm we already know.

**6. Into the setup**
- The model organism: the modular-addition ['clock'](https://arxiv.org/abs/2306.17844) that one-layer transformers learn when they grok ([Nanda et al.](https://arxiv.org/abs/2301.05217)).
- Framing note up front: addition mod $p$ is commutative, so a chain can be solved all at once by averaging the tokens ([Liu et al.](https://arxiv.org/abs/2210.10749)). This post asks what a loop does with a task it doesn't need to loop for; the follow-up removes the shortcut.
- Roadmap: getting loops to grok and stay grokked (part 1) → what they learn and how they use the loop (part 2) → the follow-up.
- [NAMING: the tl;dr calls this post "Part 1" and the follow-up "part 2", but the section headings below also say part 1 / part 2. Rename one before writing the roadmap line]

## setup

**Task.**
<!-- check against configs/data.yaml before publishing -->

**Training.**

**Models.**

[ARCHITECTURE FIGURE: plain loop vs Huginn, one panel each]

## part 1 (sub-result): getting stable grokking checkpoints

**What grokking needs.**

{% include figure.liquid path="assets/img/recurrent-grokking/looping.png" class="img-fluid rounded" zoomable=true alt="Three panels comparing a one-pass one-layer model with unnormalized looped and deep models: only the one-pass model's embedding becomes Fourier-sparse and its losses fall; the others stay at or above uniform-guess loss." caption="Depth without normalization fails. Nanda's one-layer model groks; the same layer looped 2× or 8×, and 8 unshared layers, never do. Dotted line: ln 113, the loss of a uniform guess. Seed 41." %}

{% include figure.liquid path="assets/img/recurrent-grokking/normalization.png" class="img-fluid rounded" zoomable=true alt="Three panels comparing norm placements in the plain loop and Huginn: state-norm loop, sandwich loop and sandwich Huginn become Fourier-sparse and their losses fall below uniform; unnormalized plain loop and state-norm Huginn do not." caption="Normalization unlocks grokking, but where it goes depends on the architecture: a norm on the carried state works for the plain loop and breaks Huginn. Solid: plain loop; dashed: Huginn. Seed 41." %}

{% include figure.liquid path="assets/img/recurrent-grokking/injection.png" class="img-fluid rounded" zoomable=true alt="Three panels of Huginn ablations: the reference and the embedding-start variant become Fourier-sparse and their losses fall; removing input injection or the prelude/coda keeps sparsity flat and losses above uniform." caption="Huginn needs input injection and its prelude/coda; without either it memorizes. Seed 41." %}

{% include figure.liquid path="assets/img/recurrent-grokking/weight_decay.png" class="img-fluid rounded" zoomable=true alt="Three panels of Huginn at four weight decay strengths: λ = 1 and 2 become Fourier-sparse and their losses fall; λ = 0 and 0.5 stay dense and their losses stay above uniform, with λ = 0 rising steadily." caption="Weight decay is necessary: at λ = 0 Huginn memorizes. Seed 41." %}

**Why grokked models fall apart.**

[FIGURE: Huginn on the standard recipe (val accuracy and step loss over 20k steps), next to the weight-decay arms from the same checkpoint]

**The fix.**

[FIGURE: sandwich loop, two-phase vs standard recipe, identical until the switch]

## part 2 (main result): what the loops learn

**The same solution as the one-layer model.**

[FIGURE: per-pass accuracy by chain length, three models]

**Different ways of using the loop.**

[TABLE: how each model uses its loop (past training depth, use of state); see archive]

[FIGURE: loss and perturbation size vs pass, to 256, for the three models]

## takeaways

**Next.**

## limitations

__thanks for reading! check back later for updates__
