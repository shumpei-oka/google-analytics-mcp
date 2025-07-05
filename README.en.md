# Google Analytics MCP for Claude

This is a Desktop Extension for Claude that allows you to fetch and aggregate Google Analytics data as a tool.

---

## ✨ Features

- **List Properties**: Get a list of accessible GA4 properties.
- **Flexible Reporting**: Generate custom reports by freely specifying periods, metrics, and dimensions.
  - e.g., "Show me the number of sessions and users by country for last week."
  - e.g., "Tell me the number of pageviews for each page in the last 30 days."

## 🛠️ Setup Instructions

To use this extension, you need to configure a service account in Google Cloud Platform (GCP) and grant permissions in Google Analytics.

### 1. Setup Service Account on Google Cloud (GCP)

1.  **Enable APIs in your GCP project**

    - Enable the [Google Analytics Admin API](https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com).
    - Enable the [Google Analytics Data API](https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com).

2.  **Create a Service Account**

    - Go to the [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts) page in the GCP console.
    - Click "Create service account".
    - Enter an account name (e.g., `claude-ga-mcp`) and proceed.
    - **Role selection is not required here.** Do not grant any roles at this step, just click "Continue" and then "Done".

3.  **Create and download a JSON key**
    - Click on the email address of the service account you just created.
    - Go to the "KEYS" tab.
    - Select "Add Key" > "Create new key".
    - Choose **JSON** as the key type and click "Create".
    - A key file (e.g., `my-project-12345.json`) will be automatically downloaded. **Store this file in a secure location.**

### 2. Grant Permissions in Google Analytics

1.  Go to the admin page of the Google Analytics property you want to grant access to.
2.  Navigate to "Admin" > "Account Access Management".
3.  Click the "+" button in the top right > "Add users".
4.  In the **Email address** field, paste the email address of the service account you created (e.g., `claude-ga-mcp@my-project-12345.iam.gserviceaccount.com`).
5.  Select the **Viewer** role.
6.  Click "Add".

### 3. Install and Configure the Extension

1.  **Clone or download this repository**
    ```bash
    git clone <repository_url>
    ```
2.  **Install dependencies**
    ```bash
    cd google-analytics
    npm install
    ```
3.  **Package the extension**

    ```bash
    dxt pack
    ```

    This will generate a file named `GoogleAnalyticsMCP.dxt`.

4.  **Install the extension in Claude**

    - Go to Settings > Extensions in the Claude desktop app.
    - Select "Add Extension" > "Install from file" and choose the `.dxt` file you just generated.

5.  **Configure the extension**
    - Open the settings (gear icon) for the installed "Google Analytics MCP".
    - **Service Account Key File**: Click the "Choose File" button and select the **JSON key file** you downloaded in Step 1.
    - **Default GA4 Property ID**: (Optional) You can enter a frequently used GA4 property ID to omit specifying it when using the tools.
    - Click "Save".

Setup is now complete! Try asking Claude something like, "List my GA properties."

## 📜 License

[MIT](LICENSE)
