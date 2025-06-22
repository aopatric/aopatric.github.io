---
layout: page
title: OBRAG
description: A local Obsidian-based RAG agent for querying your aggregated knowledge base.
img: assets/img/obs.png
importance: 1
category: projects
related_publications: false
---

I decided to go ahead and build a local RAG setup to attach to Obsidian vaults. The need for such a tool came from constantly
searching for answers to questions within my Obsidian vault that could be easily queried with natural language. To solve this issue,
OBRAG was born. 

For now, OBRAG exists as a python package; release version `0.1.0` is out as of this edit! You can check out the package on PyPI
[here](https://pypi.org/project/OBRAG/0.1.0/). Limited feature set for now, but usage typically looks like a CLI call when you have a question, i.e.

```python
obrag --ask "What is the Capital of France?"
```

Feel free to try it out and let me know if there are any improvements or changes you'd like to see!