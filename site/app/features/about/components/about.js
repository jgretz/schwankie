import React from 'react';

export default () => (
  <div className="about">
    <h1>Schwankie.com</h1>
    <h3>A random index of the web</h3>
    <p>TLDR: It&#39;s a fancy replacement for my browser bookmarks</p>
    <div className="message">
      <span>
        I read a lot. Whether from Twitter, newsletters, HackerNews, or
        conferences - a large percentage of my life is spent drinking from the
        information firehose that is the internet. A lot of what I find, I
        categorize and store for the future. That said, I&#39;ve been doing this
        for years, and much of what I&#39;ve indexed lies unfindable in my
        Chrome bookmarks. This is the problem this site is intended to fix.
        <br />
        <br />
        In addition to providing a public, searchable index of my bookmarks, I
        also wanted to build a better way of categorizing them. With the nature
        of bookmarks, the only real categorizing you can do is with a lot of
        nested folder. Rather than follow that paradigm, this site allows me to
        tag each link as well, adding a layer of knowledge and discoverability
        that I have been missing.
        <br />
        <br />
        My bookmarks tend towards either tech or cooking, so if you are looking
        for something in those domains, chances are you might find something
        interesting or helpful here. If you do, please consider buying me a
        coffee (I love coffee :))
      </span>

      <br />
      <br />
      <div className="coffee">
        <a
          className="bmc-button"
          target="_blank"
          href="https://www.buymeacoffee.com/joshgretz"
        >
          <img
            src="https://www.buymeacoffee.com/assets/img/BMC-btn-logo.svg"
            alt="Buy me a coffee"
          />
          <span>Buy me a coffee</span>
        </a>
      </div>
    </div>
  </div>
);
