---
layout: about
title: about
permalink: /
subtitle: MIT AI Grad in ML Research

profile:
  align: right
  image: prof_pic.jpg
  image_circular: false # crops the image to make it circular
  more_info: >

selected_papers: false # includes a list of papers marked as "selected={true}"
social: true # includes social icons at the bottom of the page

announcements:
  enabled: true # includes a list of news items
  scrollable: true # adds a vertical scroll bar if there are more than 3 news items
  limit: 5 # leave blank to include all the news in the `_news` folder

latest_posts:
  enabled: true
  scrollable: true # adds a vertical scroll bar if there are more than 3 new posts items
  limit: 3 # leave blank to include all the blog posts
---

Hi! My name is Angel, and I recently graduated from MIT with a B.S. in AI and Decision Making. I'm currently enrolled in the MEng program at MIT, and I'm using this Fall 2026 semester to work on interpretability for recurrent-depth language models before returning to school to complete my thesis.

I'm currently working on establishing a basic mechanistic understanding of interpretablity for recurrent-depth models. This is an active WIP, but has thus far produced a blog post (coming soon!) on the recipe for grokking capability in toy-scale recurrent-depth models. Ongoing experiments hope to recover a [clock-algorithm](https://arxiv.org/abs/2301.05217)-level understanding of the algorithm implemented by looped models following both the [Universal Transformer](https://arxiv.org/abs/1807.03819) and [Huginn](https://arxiv.org/abs/2502.05171v2)-style recurrent-depth training recipes.

Some of my other recent projects have included a critical revisit of [my work](https://github.com/aopatric/post-training-EoS) on the Edge of Stability phenomenon for language model post-training, and an experimental [library](https://github.com/aopatric/intact) I built to efficiently sample rollouts and collect activations for studying reward hacking in Qwen3-4B. I used this library as a foundation for several notebook-level experiments in employing patching and probing techniques to detect and mitigate hacking behavior.

My time as an undergrad was spent across a few different research groups across MIT. I was fortunate enough to help design and prototype a benchmark for spatial reasoning in both neuro-symbolic and language-based models built around the inverse origami problem (later published by the lab as [OrigamiBench](https://icml.cc/virtual/2026/68020)) with Prof. Armando Solar-Lezama's group at CSAIL, contribute core training and communication infrastructure to a decentralized and data-private solution for federated learning ([SONAR Web](https://dl.acm.org/doi/10.1145/3737899.3768523), ACM FLEdge-AI '25, Best Presentation) with the Camera Culture group at the Media Lab, and adapt masked language modeling approaches to single-cell transcriptomics data from the CELLxGENE Census for imputation and classification with the Edelman Lab at IMES.

Outside of my MIT-affiliated work, my personal research interests lie heavily in the interpretability and alignment of highly capable language models, from the very first training step. I have much interest in the existing literature on recurrent-depth language models and their capacity to be latent reasoners. I think a strong tool to decipher these latent thoughts is necessary for the scalable, performant, capable, and most importantly safe models of the future. In that vein, I've also been building up intuition from the ground up in my [toy-transformers](https://github.com/aopatric/toy-transformers) repo, which contains notebooks exploring 0-, 1-, and (soon) 2-layer attention-only transformers in the style of [A Mathematical Framework for Transformer Circuits](https://transformer-circuits.pub/2021/framework/index.html) (Elhage et al., 2021). Feel free to poke around!

When I'm not working on one of the above things, I'm often doing any one of producing or DJing or consuming music, poking around with the latest AI coding tools, or just hanging out with my cat, Cillian. I'm also a fan of MMA and have been training BJJ for a little over a year now. I'm always open to dialogue and I deeply enjoy discussing research topics, so feel free to reach out!
