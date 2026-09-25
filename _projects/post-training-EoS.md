---
layout: post
title: Finding the Edge of Stability for LLM Post-Training
description: Investigating an extension of the Edge of Stability phenomena in the context of language model post-training. Instruction tuning task built from the Alpaca dataset, using the Pythia model suite for pre-trained, non-instruction-tuned model organisms.
img: assets/img/eos-emergence-thumbnail.svg
importance: 1
category: academic
related_publications: false
---

Modern neural networks owe their success in part to the power of learning under gradient-based methods and, in particular, gradient descent. Throughout recent years, many efforts have been put into understanding the dynamics of learning under GD. One such effort produced the naming of a widely accepted phenomena termed the [Edge of Stability](dummy.link) (EoS), which says for the batch GD case that the landscape _sharpness_ (largest Hessian eigenvalue $\lambda_\max$ w.r.t. loss) experiences a steady increase (coined _progressive sharpening_) until it reaches a limiting threshold of $2 / \eta$ for learning rate $\eta$. At that point, learning has been observed to oscillate around this $2 / \eta$ boundary value until model convergence.

<div align="center" style="padding-bottom: 24px;">
  <img src="/assets/img/eos-emergence-thumbnail.svg" width="750" alt="Graphical depiction of progressive sharpening preceeding EoS oscillations.">
</div>

The EoS phenomena has since been adapted to conjugate phenomena in cases where we have [stochastic gradient descent](), [adaptive optimizers](), [transformer architectures](), and [more](). Nonetheless, it remains unexplored the extent to which EoS presents itself under the strong _distribution shift_ experienced by language models undergoing post-training refinement.

This experiment is built on top of the Pythia model suite. CONTINUE!
