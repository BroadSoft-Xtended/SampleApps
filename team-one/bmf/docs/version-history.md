## Version 1.5.0 - May 18, 2017

 * added `my_user_id` attribute to `BaseBot`, populated by `fetch_screen_name`.
 * added `send_typing(org_id,workspace_id)` method to `BaseBot`.
 * added two new event types, addressing some RTM payload types not previously recognized by the framework.
   * `rtm/user_typing` is emitted when a `type=user_typing` payload is received from the RTM&nbsp;API.
   * `rtm/note` is emitted when a `type=note` payload is received from the RTM&nbsp;API.
 * added logic for temporarily ignoring specific users in specific workspaces:
   * `ignore(workspace_id, user_id, duration_in_seconds)` will cause the bot to ignore `message`, `user_typing` and `note` payloads in the specified workspace triggered by the specified user for the specified amount of time.
   * `stop_ignoring(workspace_id, user_id)` will stop ignoring the specified user in the specified workspace
   * `should_ignore(payload)` will return `true` if the specified payload should be ignored, `false` otherwise.

## Version 1.4.0 - May 11, 2017

 * added `rest_client` attribute to `BaseBot`, exposing an instance of [Intellinote Client](https://github.com/intellinote/intellinote-client) that can be used to make non-tunnelled REST API calls.

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
