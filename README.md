# Bubble to google sheet
Code I used in a project to copy Bubble database code into a Google sheet using node. Everytime you run it, it appends a snapshot 
to the sheet, with a timestamp.


## Setup
Google Cloud credentials are stored in a json you get when setting up the gcloud service account in order to enable the Sheet API.

Something like this:

```
{
  "type": "service_account",
  "project_id": "aasdsadsat",
  "private_key_id": "6sadsadsaa982",
  "private_key": "-----BEGIN PRIVATE KEY-----\nsadsadsadsadsab\n-----END PRIVATE KEY-----\n",
  "client_email": "test-483@asadsadasds.iam.gserviceaccount.com",
  "client_id": "1104342343279869",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/tedsfdsfdeet.iam.gserviceaccount.com"
}
```

The bubblegoogle.json file should contain something like this:

```
{
    "development": {
        "url": "https://sdfdsfds.esdsa.com/version-test/api/1.1/obj/",
        "googleSpreadsheetID": "1JNR5Zsdfsdfsdfsd-iEnAlE",
        "token": "sdfdsfdsfds64382",
        "tables": [
            "SMSlogs",
            "Store",
            "User",
            "Websiteinfo",
            "Province"
          ]
    },
    "production": {
        "url": "https://asdasdb.easdsado.com/api/1.1/obj/",
        "googleSpreadsheetID": "1j5dfgdfdutVs",
        "token": "a5dfgdgdgdgdgfd2",
        "tables": [
            "SMSlogs",
            "Store",
            "User",
            "Websiteinfo",
            "Province"
          ]
    }
}
```
The url and token come from your Bubble API config screen. The name of the tables are the ones shown in the API screen and have a 
checkmark - and are the ones you want to upload. If the name has a space, just add the name without the spaces in the array.

The googleSpreadsheetID is the long code in the url of the sheet.

You need to enable write access on the google sheet to the email of the service account.

## Running the script

Run the script with
```
node google_sheet.js dev
```
or
```
node google_sheet.js prod
```
or
```
node google_sheet.js dry
```
Dry does a dry run on the production data.

The nice part of the Google Sheet API in node is that it dynamically adds columns, meaning if you add a column in the sheet, it then gets appended.