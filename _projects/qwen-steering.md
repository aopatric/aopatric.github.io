---
layout: post
title: A Mechanistic Interpretability Testbed for Reward Hacking
description: An ongoing testbed for mechanistic interpretability tools, built on a reproducible setup for RL-induced reward hacking in Qwen3-4B. Probing, activation patching, and steering, added in stages.
importance: 2
category: independent
related_publications: false
---

**under construction!!!**

<!-- PLACEHOLDER: replace with the full writeup. -->

_This project is ongoing; this page is a placeholder and will be filled in as the work progresses._

This project extends the reproducible RL-induced reward hacking setup from [ariahw/rl-rewardhacking](https://github.com/ariahw/rl-rewardhacking) for Qwen3-4B into an expandable testbed for mechanistic interpretability tools. It doubles as a live testbed for trying out different interpretability methods as I learn the landscape of the field ahead of grad school.

The plan is to build it in stages:

1. **Activation caching** over rollouts via PyTorch forward hooks (done).
2. **Linear probes** on residual-stream activations to detect hacking vs. honest behavior at prompt time.
3. **Activation patching** to localize the components responsible.
4. **Steering** along probe directions to suppress hacking.

Code lives at [aopatric/qwen-steering](https://github.com/aopatric/qwen-steering).
