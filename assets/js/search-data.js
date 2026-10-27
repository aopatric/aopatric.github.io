// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-papers",
          title: "papers",
          description: "A collection of both my published work as well as the published work in which I am acknowledged.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/papers/";
          },
        },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog";
          },
        },{id: "nav-resume",
          title: "resume",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "post-on-serial-depth-and-monitorability-in-looped-transformers-part-1",
        
          title: "On Serial Depth and Monitorability in Looped Transformers, Part 1",
        
        description: "Blog post for part 1 of a 2-part study on the computation that happens before a token is emitted in looped transformers, motivating future work in studying the impact that an increased serial depth could have on monitorability.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/recurrent-grokking/";
          
        },
      },{id: "post-intact-interpretable-activations-for-reward-hacking",
        
          title: "IntAct (Interpretable Activations for Reward Hacking)",
        
        description: "Short writeup about the first version of IntAct.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/intact/";
          
        },
      },{id: "post-finding-the-edge-of-stability-for-llm-post-training",
        
          title: "Finding the Edge of Stability for LLM Post-Training",
        
        description: "Revisit of my 6.7960 term project investigating the EoS phenomenon in language model post-training. Null result, but learned a ton.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/edge-of-stability/";
          
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/aopatric", "_blank");
        },
      },{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%61%6F%70%61%74%72%69%63@%6D%69%74.%65%64%75", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
