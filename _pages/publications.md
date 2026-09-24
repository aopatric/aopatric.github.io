---
layout: page
permalink: /papers/
title: papers
description: A collection of both my published work as well as the published work in which I am acknowledged.
nav: true
nav_order: 1
---

<!-- _pages/publications.md -->

<!-- Bibsearch Feature -->

{% include bib_search.liquid %}

<div class="publications">

<h2>Publications</h2>
{% bibliography --query @*[acknowledgement!=true]* %}

<h2>Acknowledgements</h2>
{% bibliography --query @*[acknowledgement=true]* %}

</div>
