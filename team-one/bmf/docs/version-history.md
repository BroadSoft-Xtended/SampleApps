# Team-One BMF Version History

## Version 1.4.0 - May 11, 2017

 * New `rest_client` helper added to `BaseBot`, providing _dozens_ of convenience methods for direct (non-tunnelled) interactions with the Team-One REST API.  See [Team-One Client](https://github.com/intellinote/intellinote-client) for details.
 
## Version 1.3.1 - May 9, 2017

 * `replace_my_screen_name` method now exposes third parameter `replace_globally`, defaulting to true.
 * expose `fetch_screen_name` method

## Version 1.3.0 - May 9, 2017

 * New `fetch-screen-name` config parameter to automate introspection of bot's screen name on `hello`.
 * New `replace_my_screen_name` method to strip  `@botname` from input text (or replace it with another string).
 * New `options` parameter to `send_reply`, currently recognizing one parameter named `@mention` (or `at_mention`).
    - when `auto` (the default), replies in group workspaces will be prefixed with `@screen_name` for the user being replied to.
    - when `true`, all replies will have that prefix
    - when `false`, the prefix is never used.

## Version 1.2.0 - May 8, 2017

 * First public version.
