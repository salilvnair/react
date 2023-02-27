# React by Salil

> Creating your own declarative, efficient, and flexible JavaScript library.

> Basically a lightweight React library to understand the internals of the React.




----
> Notes

Since React v0.12, there's no more `/** @jsx React.DOM */`, [see here](https://facebook.github.io/react/blog/2014/10/28/react-v0.12.html#jsx-changes).

They call it ["The @jsx Pragma"](https://facebook.github.io/react/blog/2014/10/16/react-v0.12-rc1.html#the-jsx-pragma-is-gone). It was used to allow you to specific how the output of the React Transformer should look.

So, back in the days, when compiling JSX expressions to JavaScript, they defaulted to `React.createElement()` calls. But you could modify this behavior with the beginning `/** @jsx React.DOM */` comment. The idea was to make the transform more generic and allow you to specific how the output should look.

Not anymore. The React team shares in their release v0.12 notes:

> We have wanted to do this since before we even open sourced React. No more `/** @jsx React.DOM */`!. The React specific JSX transform assumes you have React in scope (which had to be true before anyway).
