# i18n and translation guide

Translations contributions are very well welcome from the community.

At the moment to participate it is possible to use pull-requests from github:

1. First of all fork this project
2. Clone the repo locally
3. Make your changes
4. Create a pull request

We will make checks on the language coherence and on the files structure. If everything is ok we will merge your changes in the project and add the language in the available ones list!

## Contribution guide

To update some message, just make your changes in the selected languages json.

You can find them in the current folder `/src/i18n/<language_code>`. All messages are available in two different files: one for the labels and short messages, one for the longer texts (like guides or helpers).

Those files are `messages.json` and `helper-messages.json`.

The language code is the unique identifier for the language, composed by the first two letters for the language ([ISO 639-1](https://www.w3schools.com/tags/ref_language_codes.asp)) and the second two in uppercase for the country ([ISO country codes](https://www.w3schools.com/tags/ref_country_codes.asp)) divided by an underscore "_".

ie: en_US (english from US)

If you are creating a language that is not currently present, please be sure to use that format for the new folder and the same naming for the two files. 

If you are just starting from scratch, we do suggest to copy the en_US folder, changing the folder name and then moving to the specifi translations.

All JSON files are using a hyerarchical structure to allow an easier message retrieval, so to get a dashboard alert message you can search in *dashboard* object for an *alert* object or property.

Be aware that the [JSON](https://www.json.org/json-en.html) standard requires specific structures and the usage of double quotes identifiers and commas. If you have doubts use any online validator to check your syntax.

Remember at last that all translations MUST be in UTF-8 coding.