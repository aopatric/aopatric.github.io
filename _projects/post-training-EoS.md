---
layout: post
title: Finding the Edge of Stability for LLM Post-Training
description: Revisit of my 6.7960 term project investigating the EoS phenomenon in language model post-training. Null result, but learned a ton.
img: assets/img/eos/thumbnail.svg
importance: 1
category: academic
related_publications: false
---

<!-- TL;DR (1–2 sentences, ~40 words): what the question was, that the original answer
("no EoS in post-training") turned out to be a measurement failure, and that the rebuild
ended inconclusive but taught you something real. Mention that this was always an
exploration, not something meant for publication. -->

_tl;dr:_ does the training behavior of language models in post-training share a generally accepted characteristic observed in full-batch training at small scale? previous attempt said no, but a revisit showed that was a weak claim. re-attempt ended inconclusively, but included rounds of iteration that taught me more about research engineering than a successful one would have.

(_note_: since this revisit was meant as an exploration and less of a publication, there were no novel figures generated beyond those in `tensorboard`. figures in this writeup come from existing literature and are cited as such.)

## The Edge of Stability?

<!-- ~200 words. Tighten the existing intro below. -->

Much of modern deep learning's success is attributed to gradient descent (GD). In recent years, a wave of research effort has been dedicated toward understanding the geometry of learning in neural nets trained with GD. The Edge of Stability (EoS) is one product of that effort: it describes a deviation, observed in practice, from standard results in optimization theory about gradient descent on twice-differentiable losses. The argument generally goes as follows:

We can take any sufficiently smooth ($\in C^2$) loss function $f(\theta)$ and consider a second-order Taylor approximation within some neighborhood of a _local minimum_ $\theta^{\ast}$, where $H = \nabla^2 f(\theta^\ast)$ is the Hessian at the minimum:

$$
\begin{align*}
f(\theta) & =  f(\theta^{\ast}) + \nabla f(\theta^{\ast})^\top (\theta - \theta^{\ast}) + \frac 1 2 (\theta - \theta^{\ast})^\top H (\theta - \theta^{\ast}) + o(\|\theta - \theta^\ast\|^2) \\ 
& \approx f(\theta^\ast) + \nabla f(\theta^\ast)^\top (\theta - \theta^\ast) + \frac 1 2 (\theta - \theta^\ast)^\top H (\theta - \theta^\ast)
\end{align*}
$$

Since $\theta^{\ast}$ is a stationary point, $\nabla f(\theta^{\ast}) = 0$. Taking the gradient of this approximation gives:

$$
\nabla f(\theta) \approx \nabla f(\theta^{\ast}) + H(\theta - \theta^{\ast}) = H(\theta - \theta^{\ast})
$$

So consider the gradient update step:

$$
\begin{align*}
  \theta_{t+1} & = \theta_t - \eta \nabla f(\theta_t) \\
  & \approx \theta_t - \eta H (\theta_t - \theta^{\ast})
\end{align*}
$$

Under this approximation, subtracting $\theta^{\ast}$ from both sides lets us express this relationship in terms of the update performed by gradient descent on the _error_ vector to the optimum, $\delta_t = \theta_t - \theta^\ast$, for each time step:

$$
\begin{align*}
  \theta_{t+1} - \theta^{\ast} & =  (\theta_t - \theta^{\ast}) - \eta H (\theta_t - \theta^{\ast}) \\
  \delta_{t+1} & = (I - \eta H) \delta_t.
\end{align*}
$$
 
This reveals that under this second-order approximation, each gradient update multiplies $\delta_t$ by $(I - \eta H)$, and along any eigendirection $\nu_i$ of $H$ the error is scaled by $(1 - \eta \lambda_i)$. So we can treat this gradient descent update like any other linear mapping, and consider the top eigendirection $\nu^\ast$ of $H$, with eigenvalue $\lambda_\text{max}$. Since we took $\theta^\ast$ to be a _local minimum_, the second-order necessary condition for smooth objectives forces $H \succeq 0$. A positive semi-definite (PSD) $H$ forces all of its eigenvalues $\lambda_i \geq 0$, so $\lambda_\text{max}$ is also the largest eigenvalue in magnitude, and $\nu^\ast$ is the first eigendirection along which training becomes unstable as $\eta$ grows. For $\delta_t$ to converge to $0$ along $\nu^\ast$ as $t \to \infty$, we need $\lvert 1 - \eta \lambda_\text{max}\rvert < 1$. But:

$$
\begin{align*}
  | 1 - \eta \lambda_\text{max} | < 1 & \iff 1 - \eta \lambda_\text{max} < 1 \quad \text{and} \quad -1 + \eta \lambda_\text{max} < 1 \\
    & \iff 0 < \lambda_\text{max} \quad \text{and} \quad \lambda_\text{max} < \frac 2 \eta.
\end{align*}
$$

The first condition holds automatically for any nonzero PSD Hessian. The second condition is key; it tells us that when we are near a local minimum, curvature $\lambda_\text{max} > \frac 2 \eta$ creates _local instability_, causing the error vector to oscillate with growing magnitude along $\nu^\ast$ with each training step (at exactly $\lambda_\text{max} = \frac 2 \eta$, it oscillates without shrinking). A similar argument applies to a quadratic model around any _iterate_ of gradient descent, not just a minimum, which led to the longstanding belief that gradient descent on neural networks is unstable in regions where the sharpness ($\lambda_\text{max}$) exceeds $\frac 2 \eta$.

Despite this analytic result, the original [Cohen et al. (2021)](https://arxiv.org/abs/2103.00065) paper observed a two-stage phenomenon in practice when training neural networks with full-batch GD: a phase of _progressive sharpening_ (wherein the local $\lambda_\text{max}$ at iteration $t$ starts low and rises steadily to the $\frac 2 \eta$ threshold) and a phase of _stable oscillation_ (wherein the local curvature hovers around the $\frac 2 \eta$ threshold while the loss continues to decrease, albeit non-monotonically). These observations contradicted the predictions made by the second-order approximation and at the time raised several questions as to the nature of this phenomenon, including whether EoS is intrinsic to gradient descent on neural networks in practice. Since then, much work has expanded upon the original EoS paper, including many asking similar questions about learning geometry in new learning contexts.

{% include figure.liquid path="assets/img/eos/figure_5.png" class="img-fluid rounded" zoomable=true alt="Six plots of train loss and sharpness over training for MSE and cross-entropy losses at several learning rates; sharpness rises until reaching the dashed 2/η line for each learning rate and then hovers there." caption="Figure 5 from Cohen et al. (2021): under full-batch GD, sharpness rises until it reaches 2/η (dashed lines), then hovers there for both MSE (top) and cross-entropy (bottom) losses; with cross-entropy, sharpness also declines late in training." %}

In particular, the EoS umbrella has grown to include analogous phenomena for stochastic gradient descent [(Andreyev & Beneventano 2024)](https://arxiv.org/abs/2412.20553) and for adaptive optimizers [(Cohen et al. 2022)](https://arxiv.org/abs/2207.14484). Recent work has even used EoS as a tool for building new analytic frameworks for neural network optimization, including proving generalization bounds by modeling SGD as a random dynamical system that converges to a fractal attractor at the EoS [(Tuci et al. 2026)](https://arxiv.org/abs/2604.19740). Nevertheless, the extent to which EoS emerges in language model _post-training_, if at all, remains largely unexplored.

### Aside: Why Post-Training?

To be fair, I first came across both EoS and this question in a list of curated term project topics for MIT's 6.7910 Statistical Learning Theory, and later took it on as my term project for 6.7960 Deep Learning. However, I chose to investigate it because post-training differs from most of the settings studied in the EoS literature: it shifts the _domain_, the _target_, and, in practice, the _learning rate_, all of which can affect how much EoS shapes the learning trajectory. The learning rate is the most interesting of the three. Fine-tuning typically uses learning rates one to two orders of magnitude smaller than pretraining, so for plain GD the stability threshold $\frac 2 \eta$ is huge: at $\eta = 10^{-5}$, it sits at $200{,}000$. Does the sharpness of a pretrained model ever climb to meet a threshold that high within a fine-tuning run, or does post-training simply never reach the edge? That question isn't obvious a priori, and it's the one this project set out to answer. For simplicity, I chose to structure my approach around the canonical first post-training stage: supervised _instruction tuning_.

## Round one: 6.7960, Fall 2025

I originally scoped the project to include trials taking models from the [Pythia](https://arxiv.org/abs/2304.01373) suite (70M–1.4B) and fine-tuning them in an instruction-following context using the [Alpaca](https://huggingface.co/datasets/tatsu-lab/alpaca) dataset. One misstep in the original scoping was my approach to optimization. To get closer to 'real' instruction-tuning setups, my experiments were built around 'realistic' learning rates on AdamW. Additionally, since memory was a concern, there needed to be some approach to efficiently approximating $\lambda_\text{max}$. The original project did this using a single-batch estimate of local $\lambda_\text{max}$ with [PyHessian](https://github.com/amirgholami/pyhessian), a probe that proved to be extremely noisy. After results seemed to show a general trend of rising overall sharpness but far too much variation to confirm EoS, the original conclusion was that EoS _did not_ persist in post-training. At the time this decision was made after a few engineering oversights and mistakes stacked up on one another and left no clear signal that something was wrong in the experiment code.

## Coming back to it

<!-- ~150 words. -->
<!-- What made you reopen it (Sept 2026, post-graduation, MEng). -->
<!-- The key realization from the audit: the experiment couldn't tell "no EoS" apart
from "no measurement." -->

Sometime in late August, I was cleaning up some projects on my [GitHub](https://github.com/aopatric) when I decided to go back and take a closer look at my original EoS project. I decided to do a full-on audit of the experiment code given I finally had the time to discern where in the chain my tooling was failing. What I discovered were the shortcomings described above, and in particular, the realization that the codebase, as presented, _could not_ make the claim that EoS did not persist.

Further analysis let me break down the list of small issues into a few major categories:

- **invariant violations**, which came down to configuration details like gradient clipping and optimizer choice.
- **estimator noise**, which came down to overly trusting what was a fragile tool at best.
- **unfounded claims**, which arose from a combination of the above and time constraints limiting my ability to thoroughly validate findings in time.

<!-- Transition: before asking the LM question again, build an instrument you trust and
show it can see EoS where EoS is known to exist. -->

At that point, one major milestone to a successful revisit was clear. I needed a _tool_.

## Rebuilding the instrument

<!-- ~250 words. The engineering core. -->
<!-- Framing sentence: validate the instrument before trusting it. Positive controls
first, and pass/fail criteria written down before the data. -->

The main focal point behind the redesign was _verification before trust_, i.e., no measurement was taken as valid until the tool was validated against a simple known case. This initially meant writing extra unit tests, but led to much more:

**Reliable measurements of local landscape curvature:** To get a strong estimate for $\lambda_\text{max}$, the new repository includes verified custom implementations of both simple power iteration and the Lanczos algorithm, implemented in PyTorch to run efficiently on the GPU while maintaining bit-determinism. These were tested against small verified Hessians and experiments enforced agreement within $1\%$ between the two solvers to accept a measurement.

**More Precision:** After the swap to the new solvers, a problem began to emerge where the solvers were disagreeing and Lanczos had trouble converging. Analysis of logs revealed that due to the small learning rates, `fp32` was losing $\sim 3\%$ of each update to rounding error, contributing to both drift in the solvers and divergence in the measurements. After a simple swap to `fp64` at the cost of about 0.5GB of video memory, this problem resolved itself.

**Careful and intentional experimentation:** One shortcoming of my original approach to the project was the lack of sufficient unit tests for components. For the rebuild, each milestone in the process was assigned its own pass/fail criteria that determined whether we had successfully reached it. These included a positive-control test on a toy-scale MLP and batch GD to assert the tooling could even detect EoS in the first place.

The combination of these improvements (as well as many QoL improvements like modular sweepable configurations with Hydra and deterministic resume of paused runs) led to a repository that could be trusted to measure EoS in the post-training context.

## Takeaways from the revisit

<!-- ~150 words. No custom figures; state the numbers in prose. -->

<!-- Note near the top of this section: this was an exploration, so there are no
polished plots (only TensorBoard during the runs). Every number below is re-derived
from the logged runs, and the repo has instructions to reproduce them: [repo link]. -->

The two most significant experiments from the revisit were my _positive control test_ and the subsequent `Pythia-70m` run that followed it.

For the positive control experiment, I took a small MLP and trained it on Alpaca with plain batch GD using gradient accumulation while measuring local curvature with my tooling. However, this experiment produced an interesting and unexpected result: $\lambda_\text{max}$ on the fixed probe (size $n=64$) sat around 1.7–2.3× above the $\frac 2 \eta$ limit, while gradient descent clearly oscillated around _some_ boundary. This motivated a revisit of the literature that led me to [(Lee & Lee 2026)](https://arxiv.org/abs/2608.18415), which argues that $\lambda_\text{max}$ itself is a poor stability indicator in practice and finds that curvature _along the step direction_ tends to oscillate near that $\frac 2 \eta$ threshold.

After extending the measurement infrastructure one more time to measure curvature along the step direction, the EoS picture was clear. After rerunning the trial with a step sharpness measurement, I observed step sharpness oscillating near $\frac 2 \eta$ for the final third of training after a phase of progressive sharpening. EoS!

With the tool verified as capable of detecting EoS, the next run was a test on `Pythia-70m` with a somewhat more realistic $\eta=7.5 \cdot 10^{-6}$ learning rate and the same batch gradient descent setup. This experiment showed promise! For this training run, the tool detected oscillation beginning around step 1100/4000, with oscillation settling at around $0.92\times$ the $\frac 2 \eta$ limit and just barely failing the predefined test suite checking for EoS. This result is _not_ another negative result, but rather a close null. If anything, the result warrants more investigation! See below.

## Why I stopped, and what I learned

The main issue was scale. Even a cleaner lock on EoS for a 70M model on a 64-sample probe with plain gradient descent wouldn't tell us much about how real-sized language models behave under real adaptive optimizers and learning rate schedules, and getting to the point where I can run an experiment that assesses those contexts involves compute that I simply don't have access to at the moment.

Nonetheless, I learned a ton from this revisit. The biggest takeaway for me was that _a null result is only as good as the ability to detect a positive one_. Despite ending up in a similar inconclusive place as the original project, the fact that I was able to confirm EoS in a controlled environment using my custom tooling _first_ made the rest of the process significantly more robust and streamlined.

In a context where I had the time and resources available to do more experiments, I'd run additional tests on my 70M demo and scale up to 1.4B before doing larger and larger tests to analyze the impact of model scale on the emergence of EoS, if any.

Despite the null result, this project enabled me to grow significantly as an engineer and as a researcher, and the lessons learned from the process have informed subsequent projects including my recent deep dive into mechanistic interpretability as I prepare to return to school for my MEng in the spring!

## References

- Cohen et al. _Gradient Descent on Neural Networks Typically Occurs at the Edge of Stability._ ICLR 2021. [arXiv:2103.00065](https://arxiv.org/abs/2103.00065)
- Cohen et al. _Adaptive Gradient Methods at the Edge of Stability._ 2022. [arXiv:2207.14484](https://arxiv.org/abs/2207.14484)
- Andreyev, Beneventano. _Edge of Stochastic Stability: Revisiting the Edge of Stability for SGD._ 2024. [arXiv:2412.20553](https://arxiv.org/abs/2412.20553)
- Tuci, Korkmaz, Şimşekli, Birdal. _Generalization at the Edge of Stability._ 2026. [arXiv:2604.19740](https://arxiv.org/abs/2604.19740)
- Lee, Lee. _The Road Taken: The Role of Optimizers at the Edge of Stability._ 2026. [arXiv:2608.18415](https://arxiv.org/abs/2608.18415)
- Biderman et al. _Pythia: A Suite for Analyzing Large Language Models Across Training and Scaling._ ICML 2023. [arXiv:2304.01373](https://arxiv.org/abs/2304.01373)
- Taori et al. _Stanford Alpaca: An Instruction-following LLaMA Model._ 2023. [GitHub](https://github.com/tatsu-lab/stanford_alpaca)
- Yao, Gholami, Keutzer, Mahoney. _PyHessian: Neural Networks Through the Lens of the Hessian._ IEEE BigData 2020. [arXiv:1912.07145](https://arxiv.org/abs/1912.07145)
