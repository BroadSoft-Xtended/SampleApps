## Version 1.3.0 - May 9, 2017

 * New `fetch-screen-name` config parameter to automate introspection of bot's screen name on `hello`.
 * New `replace_my_screen_name` method to strip  `@botname` from input text (or replace it with another string).
 * New `options` parameter to `send_reply`, currently recognizing one parameter named `@mention` (or `at_mention`).
    - when `auto` (the default), replies in group workspaces will be prefixed with `@screen_name` for the user being replied to.
    - when `true`, all replies will have that prefix
    - when `false`, the prefix is never used.

## Version 1.2.0 - May 8, 2017

 * First public version.
