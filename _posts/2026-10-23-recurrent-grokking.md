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
bibliography: 2026-10-23-recurrent-grokking.bib
---

{% comment %} 

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
 {% endcomment %}

{% comment %}
v5, 2026-10-25: dense WIP version. alignment framing lives only in the foreword; everything after is the project.
previous full version (with all bullets, claim numbers, the inductive-bias essay, open questions):
recurrent-grokking/my-notes/archive/v2-before-dense-rewrite-2026-10-25.md. cut background prose:
archive/v2-cut-background-2026-10-24.md. claim numbers live in MASTER.md, not in the post.
[CAPS] = something for you to fill (figure, link, comment).
{% endcomment %}

{% comment %}
v6, 2026-10-26: prose stripped back to headings + figures for a fresh bullet outline. tl;dr untouched.
the v5 dense prose this replaced: recurrent-grokking/my-notes/archive/v2-before-outline-revert-2026-10-26.md.
{% endcomment %}

{% comment %} tldr/abstract: needs repo link {% endcomment %}

tl;dr: Part 1 of a 2-part study on intra-token computation<d-cite key="skye2026shadow"></d-cite> in looped transformers<d-cite key="raschka2026loopedgallery"></d-cite>. I follow the training recipe from Nanda et al. (2023)<d-cite key="nanda2023progress"></d-cite> to compare a one-layer Vaswani et al.<d-cite key="vaswani2017attention"></d-cite> transformer baseline, a simplified looped model based on the universal transformer<d-cite key="dehghani2019universal"></d-cite>, and a Huginn<d-cite key="geiping2025huginn"></d-cite> variant on the task of $n$-hop modular addition base $113$. I find that in this task the the looped models do _not_ learn iterative algorithms and instead abuse a 1-pass shortcut while _utilizing their loops in varying ways_, achieving _similar task generalization performance_ across strategies. I additionally study the periodic training collapses I experienced in training recurrent grokkers<d-cite key="power2022grokking"></d-cite> under the Nanda et al. recipe, and propose a simple fix with standard learning rate/weight decay scheduling. This work motivates part 2, a contrasting study in a problem setting where there exists no 1-pass shortcut, and additionally motivates further exploration into the development of monitoring tools for understanding _both_ the __intra- and inter-token computation__ in looped transformers. [[code]](https://github.com/aopatric/recurrent-grokking)

(A note from me: Due to compute limitations, most experiments were run on a single seed and confirmed on a second one. I report this accordingly with each result.)

## foreword: an essay on safety and looped transformers

{% comment %} foreword outline, 2026-10-26. the opinionated part; everything after it is the project. [CAPS] = your call. target ≈400–600 words: sections 4 and 5 are a couple of sentences each, and the Astra evidence can go in a footnote {% endcomment %}

In the current landscape of production AI safety, monitoring the chain of thought (CoT)<d-cite key="wei2022chain"></d-cite> is the most relied-upon<d-cite key="pachocki2026alien"></d-cite> method for detecting agentic misalignment<d-cite key="lynch2025agentic"></d-cite>. The unfortunate tension, as Jakub Pachocki writes, is that "evaluations indicate our ability to rely on CoT monitoring is progressively diminishing."<d-cite key="pachocki2026alien"></d-cite> Despite this, the GPT-6 family system card outlines a safety system built around a pipeline that "reviews the agent's chain of thought alongside its actions."<d-cite key="openai2026astrasafeguards"></d-cite>

The argument for CoT monitoring in the first place is somewhat architectural. We assume the model offloads computation to its reasoning tokens _because_ it has a fixed computation budget (i.e., an opaque serial depth<d-cite key="browncohen2026opaque"></d-cite>). However, even the CoT monitorability position paper<d-cite key="korbak2025monitorability"></d-cite> identifies it as a fragile opportunity _in its title_, and warns the field about making research decisions that pressure the model to obfuscate the CoT _in its abstract_. OpenAI _themselves_ have even published work on the risks of obfuscation<d-cite key="baker2025monitoring"></d-cite>.

Nevertheless, recent work has shown models _are_ capable of obfuscating the CoT through output supervision<d-cite key="drori2025output"></d-cite>, training on documents about monitoring<d-cite key="haskins2026documents"></d-cite>, and in some cases even pure prompt pressure<d-cite key="zolkowski2025obfuscate"></d-cite>.

__Looped transformers introduce a distinct threat to CoT monitorability as they seek to alleviate the serial depth limitation of existing transformer architectures.__ I borrow a taxonomy from user Skye on LessWrong<d-cite key="skye2026shadow"></d-cite>, who was in the lab responsible for Ouro<d-cite key="zhu2025ouro"></d-cite>. They break down monitorability concerns into those relating to _intra-token computation_ (or "computation within a single timestep (before the model commits to a token)"), and those relating to _inter-token computation_ (or "computation from one timestep to the next").

Skye argues that inter-token computation is the bigger danger in the long term. I agree that the increased potential for inter-token computation is the larger risk in the limit, but I don't think a larger (and even _variable_) serial depth is inherently safe just because it's bounded. I'd argue that as serial depth grows, the CoT becomes more of a _projection_ of the model's internal state and less a direct record of its reasoning process. Put simply, a monitor fails when a model can do _both_ the intra-token computation to support hidden reasoning _and_ control its CoT enough to obfuscate it. Neel Nanda notes<d-cite key="nanda2026astra"></d-cite> that these are _separate_ abilities: "controllability seems very dependent on details of post-training, while no CoT reasoning is largely determined by the pretrain." Since looping is an architectural and thus a pretraining decision, it has the potential to move the no-CoT axis directly, independent of post-training. So I think the potential for CoT obfuscation along _both_ axes should be studied.

{% include figure.liquid path="assets/img/recurrent-grokking/reasoning.png" class="img-fluid rounded" zoomable=true alt="Two panels comparing how a standard transformer and a looped transformer might answer a prompt." caption="The above figure highlights how the increase in serial depth could increase separation of the model's internal reasoning from the emitted CoT." %}

Studying the impact of recurrence in particular on monitorability is also plainly timely. The past two years have seen the publication of a substantial number of open LoopLMs including Huginn<d-cite key="geiping2025huginn"></d-cite>, the aforementioned Ouro<d-cite key="zhu2025ouro"></d-cite>, Nanbeige<d-cite key="nanbeige2026"></d-cite>, and Parcae<d-cite key="prairie2026parcae"></d-cite><d-footnote>For even more evidence that the field is considering LoopLMs as a way forward, the Parcae paper even includes their own scaling laws for looping.</d-footnote>. Beyond the open releases, there has been much discussion<d-cite key="raschka2026astra,efrati2026astra"></d-cite> of looped transformers making their way into frontier labs. The case for Astra being a monitorability concern is real, and as Neel Nanda remarks, Astra can do a "concerning amount"<d-cite key="nanda2026astra"></d-cite> with no CoT.

{% include figure.liquid 
   path="assets/img/recurrent-grokking/nanda-reasoning-index.png" 
   class="img-fluid rounded" 
   zoomable=true 
   alt="Figure compares the No-CoT Reasoning Index value vs. the Epoch Capability Index value of various frontier language models. Astra is a clear outlier." 
   caption="Figure borrowed from the same Neel Nanda <a href = 'https://www.lesswrong.com/posts/eRmzz8J8Qkzqvzrgg/astra-can-do-a-concerning-amount-with-no-chain-of-thought'><u>post</u></a> on the AI Alignment Forum as mentioned in the text. NCRI measures model capability with no CoT, ECI measures general model capability. Astra is a clear outlier here, while the other frontier models fall on a shared trend." 
%}

Beyond intra-token computation, the CoT that models like Astra _do_ produce is becoming increasingly controllable. Work done as recently as March of this year claims little controllability over CoT in frontier language models<d-cite key="chen2026cotcontrol"></d-cite>, using the same evaluation suite (CoT-Control) that OpenAI reports in the Astra safety overview<d-cite key="openai2026astramonitor"></d-cite>. On it, Astra has a _self-reported 60.9% controllability rate_, a far cry from 16.1% for GPT-5.6 Sol and 1.7% for GPT-5.5 Thinking.<d-footnote>These rates are for CoTs between 750 and 1,250 tokens long.</d-footnote> This control already shows up unprompted: the same safety overview reports that "under simple monitoring-awareness (without being told to evade the monitor), [Astra] spontaneously generates substantially fewer chain-of-thought tokens," and that in adversarial evaluations it "can sometimes evade our internal monitors when asked to perform certain sabotage tasks."<d-cite key="openai2026astramonitor"></d-cite>

> My claim is this: when the distribution of emitted tokens is highly controllable and enough serial computation fits within a single forward pass, a monitor built around reading from those emitted tokens is reading what the model __chose to show it__. Monitoring tools for the next generation of latent reasoners __must__ touch the computation itself.

This two-part project aims to isolate the intra-token computation in looped transformers in order to study the degree to which it could affect monitorability.

{% comment %} 
**5. Self-consistency, extended to depth**
- The existing response: [Self-CTRL](https://arxiv.org/abs/2606.18327) (Pres, Ruis, Ghebreselassie, Li & Andreas 2026) uses RL to make a model's self-explanations agree with its behavior on related inputs (updating either side), and the self-reports then help a third-party auditor predict refusals.
- Its limit here: both sides of the check are outputs. A model that can do the work in its loop and shape its words can be consistent and still opaque.
- Your extension: make the latent computation one side of the check. For a looped model, does what it says it computed match what its per-pass states show? [STANCE: one or two sentences, framed as the direction, not a result]
- The prerequisite, which is the bridge: checking a model's account of its loop needs ground truth for what the loop computes, so we need looped models that learn an algorithm we already know.
{% endcomment %}

{% comment %} 
**6. Into the setup**
- The model organism: the modular-addition ['clock'](https://arxiv.org/abs/2306.17844) that one-layer transformers learn when they grok ([Nanda et al.](https://arxiv.org/abs/2301.05217)).
- Framing note up front: addition mod $p$ is commutative, so a chain can be solved all at once by averaging the tokens ([Liu et al.](https://arxiv.org/abs/2210.10749)). This post asks what a loop does with a task it doesn't need to loop for; the follow-up removes the shortcut.
- Roadmap: getting loops to grok and stay grokked (part 1) → what they learn and how they use the loop (part 2) → the follow-up.
- [NAMING: the tl;dr calls this post "Part 1" and the follow-up "part 2", but the section headings below also say part 1 / part 2. Rename one before writing the roadmap line]
{% endcomment %}

{% comment %}
## setup

**Task.**

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

{% endcomment %}

__hey, what are you doing here! this is a WIP! come back later...__
