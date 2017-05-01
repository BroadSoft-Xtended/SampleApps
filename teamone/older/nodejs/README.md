Current examples:

 * `lib/oauth-annotated.js` - example of using the OAuth2 protocol to authenticate to the Intellinote API and access user content via the Intellinote REST API.

    * See `example-output/oauth-annotated.color.txt` and `example-output/oauth-annotated.no-color.txt` for sample outputs from that script.

    * `lib/oauth-bare.js` - a stripped-down version of the above, with comments and annotations removed.

 * `lib/create-user.js` - demonstrates (1) user-less authentication, (2) creating a user and (3) accessing that user's account to create organizations, etc.

    * See `example-output/create-user.color.txt` and `example-output/crate-user.no-color.txt` for sample outputs from that script.

To run these examples:

1. Run `npm install` to load the external libraries used by the sample scripts.

2. Copy `config.json.sample` to `config.json`.  Edit that file to insert your `client_id` and `client_secret` values.

3. Run: `node ./lib/oauth-annotated.js <USERNAME> <PASSWORD>` or `node lib/create-user.js`, etc.

Note that you can pass the flag `--no-color` to disable the color-coded output if needed, but the scripts should automatically detect environments or contexts in which ANSI terminal colors are not supported.
