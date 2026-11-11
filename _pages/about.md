---
layout: about
title: about
permalink: /
subtitle: AI Safety Research

profile:
  align: left
  image: prof_pic.jpg
  image_circular: true # crops the image to make it circular

selected_papers: false # includes a list of papers marked as "selected={true}"
social: false # includes social icons at the bottom of the page -> set to false cuz we put them in the nav bar

announcements:
  enabled: false # includes a list of news items -> temporarily disabled, we don't have any news items at the moment
  scrollable: true # adds a vertical scroll bar if there are more than 3 news items
  limit: 5 # leave blank to include all the news in the `_news` folder

latest_posts:
  enabled: true
  scrollable: true # adds a vertical scroll bar if there are more than 3 new posts items
  limit: 3 # leave blank to include all the blog posts
---

Hi! I'm Angel. I graduated from MIT with a degree in AI and Decision Making back in May and I'm admitted to the M.Eng., planning on getting starting this spring. I'm broadly interested in how we can reliably oversee and align the behavior of super-capable and, in particular, [open](https://arxiv.org/abs/2608.07514) language models. One direction I'm interested in at the moment is monitoring tools that don't rely on the CoT, since our confidence in CoT faithfulness is [slowly diminishing](https://openai.com/index/an-alien-mind/#:~:text=our%20ability%20to%20rely,progressively%20diminishing). The end goal for me is safety; interpretability is just one way to get there, and the way I'm most passionate about.

At the moment I'm working on the second part of a 2-part investigation studying the mechanistic function of the recurrent block in a looped transformer. [Part 1](/blog/2026/recurrent-grokking/) asks this question in a canonical problem setting for mechanistic interpretability: addition $\bmod 113$. Since addition is commutative, the task doesn't require a sequential algorithm to be completed. In fact, I observe an algorithm including a single additive step and an answer read out from a global clock-like structure, similar to the one-layer baselines from [Nanda et al. (2023)](https://arxiv.org/abs/2301.05217). Part 2 asks this question on a task with no constant-time shortcut. I additionally wrote an [accompanying essay](/blog/2026/recurrent-grokking-essay) on why I'm interested in serial depth for monitorability. Some of my other recent projects include a recent [revisit](/blog/2026/edge-of-stability) of my previous work on the Edge of Stability for post-training and a small [library](/blog/2026/intact) I built to efficiently sample and manipulate both rollouts and activations from Qwen3-4B for studying reward hacking behaviors.

I spent my time as an undergrad between a few different MIT labs, where I worked on a benchmark for spatial reasoning centered around shape reconstruction with origami at CSAIL (which was published long after I left, as [OrigamiBench](https://icml.cc/virtual/2026/68020)), core infrastructure for decentralized and private federated learning at the Media Lab ([SONAR Web](https://dl.acm.org/doi/10.1145/3737899.3768523)), and adapting language modeling techniques to single-cell transcriptomics data at MIT's IMES.

Outside ML, I'm interested in music (producing, consuming), combat sports, and [my cat](/assets/img/cat.jpg){:target="_blank" rel="noopener"}. Always open to chatting about research, careers, or life in general; feel free to reach out!
