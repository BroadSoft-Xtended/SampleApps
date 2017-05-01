package net.intellinote.sample;

import java.io.InputStreamReader;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.Date;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ClientConnectionManager;
import org.apache.http.conn.scheme.Scheme;
import org.apache.http.conn.scheme.SchemeRegistry;
import org.apache.http.conn.ssl.SSLSocketFactory;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/*
 * If you would like to just run this without using the Maven build just add
 * the following jars to your classpath:
 * 	httpclient-4.1.1.jar (Apache's Http Client)
 * 	httpcore-4.1.jar (dependency of httpclient)
 * 	gson-2.3.1.jar (Google's Json Parser)
 * 	commons-logging-1.1.1.jar (dependency of gson)
 * 	commons-codec-1.4.jar (dependency of gson)
 */
public class CreateUser {
	public static void main(String[] args) {
		String server =       "https://sandbox.intellinote.net";
		String baseUrl =      "/api/rest";
	    String clientId =     "<CLIENT-ID>";
	    String clientSecret = "<CLIENT-SECRET>";

	    String accessToken = null;
	    String refreshToken = null;

	    // Setup the Gson parser
	    JsonParser jp = new JsonParser();

	    /*
	     * Use the wrapped httpClient if you don't want to go through the
	     * trouble of importing the server's SSL certificate into your
	     * keystore.  A good description of how this is accomplished can be
	     * found here:
	     *   http://javaskeleton.blogspot.com/2010/07/avoiding-peer-not-authenticated-with.html
	     *
	     * If you would like to know how to import the server's SSL certificate
	     * into your keystore please see:
	     *   http://blog.nerdability.com/2013/01/tech-how-to-fix-sslpeerunverifiedexcept.html
	     *
	     *  Once you have followed the steps to import the SSL certificate from
	     *  sandbox.intellinote.net into your keystore you can comment out the
	     *  line using the wrapped httpClient and uncomment the line below it.
	     */
	    HttpClient httpClient = CreateUser.wrapClient(new DefaultHttpClient()); // Bypass the keystore
//	    HttpClient httpClient = new DefaultHttpClient(); // Use the keystore

	    try {
	    	/** Log in via client_credentials grant to obtain the access and refresh tokens. **/

		    System.out.println("Logging-in for user-less, application-level API access.");
	    	/*
	    	 * To perform the client_credentials "log in", we submit a POST
	    	 * request to:
	    	 *
	    	 *     {BASE-URL}/auth/oauth2/access
	    	 *
	    	 * passing the following parameters in a JSON document in the
	    	 * request body:
	    	 *
	    	 *   - our client_id (as assigned by Intellinote)
	    	 *   - our client_secret (as assigned by Intellinote)
	    	 *   - the value `"grant_type": "client_credentials"
	    	 *
	    	 * If all goes well, Intellinote will respond with a JSON document
	    	 * containing an `access_token` and a `refresh_token`.
	    	 */
		    // Create the payload with Gson
		    JsonObject payload = new JsonObject();
		    payload.addProperty("client_id", clientId);
		    payload.addProperty("client_secret", clientSecret);
		    payload.addProperty("grant_type", "client_credentials");

	        HttpPost accessRequest = new HttpPost(server + baseUrl + "/auth/oauth2/access");
	        StringEntity accessParams = new StringEntity(payload.toString());
	        accessRequest.addHeader("content-type", "application/json");
	        accessRequest.setEntity(accessParams);
	        HttpResponse accessResponse = httpClient.execute(accessRequest);
		    if (accessResponse.getStatusLine().getStatusCode() != 200) {
				throw new RuntimeException("Access Request Failed : HTTP error code : "
				   + accessResponse.getStatusLine().getStatusCode());
			}

		    // Convert to a JSON object to access data using Gson
		    JsonElement root = jp.parse(new InputStreamReader((accessResponse.getEntity().getContent())));
		    JsonObject rootObj = root.getAsJsonObject();
		    accessToken = rootObj.get("access_token").getAsString();
		    refreshToken = rootObj.get("refresh_token").getAsString();
		    if (accessToken == null) {
				throw new RuntimeException("Access Request Failed : Expected an access_token value here, but found: " +
						rootObj.toString());
		    }
		    if (refreshToken == null) {
				throw new RuntimeException("Access Request Failed : Expected a refresh_token value here, but found: " +
						rootObj.toString());
		    }


		    /** Test that the access token works **/

		    System.out.println("Confirming our access works by hitting /v2.0/ping/authed.");
		    HttpGet testAccessRequest = new HttpGet(server + baseUrl + "/v2.0/ping/authed");
		    testAccessRequest.setHeader("Authorization", "Bearer " + accessToken);
		    HttpResponse testAccessResponse = httpClient.execute(testAccessRequest);
		    if (testAccessResponse.getStatusLine().getStatusCode() != 200) {
				throw new RuntimeException("Test Access Request Failed : HTTP error code : "
				   + testAccessResponse.getStatusLine().getStatusCode());
			}
		    root = jp.parse(new InputStreamReader((testAccessResponse.getEntity().getContent())));
		    rootObj = root.getAsJsonObject();
		    String accessTimestamp = rootObj.get("timestamp").getAsString();
		    if (accessTimestamp == null) {
				throw new RuntimeException("Test Access Request Failed : Expected a timestamp value here, but found: " +
						rootObj.toString());
		    }


		    /** Create a new user **/

		    System.out.println("Creating a new user.");
		    // To avoid conflicts, let's create a random email address for our new user.
		    String email = new Date().getTime() + "-" + Math.round(Math.random() * 10000) + "@example.org";

		    /*
		     * When we create the new user, we should get back:
		     *
		     *  - the `user_id` assigned to this new user
		     *
		     *  - a `refresh_token` that allows us to interact with
		     *    Intellinote on behalf of that user.
		     */
		    String userId = null;
		    String userRefreshToken = null;
		    String userPassword = "DemoPasswd1234";

		    // Creating the user is just a matter of POSTing certain attributes to the `/v2.0/user` API method.
		    JsonObject user = new JsonObject();
	        user.addProperty("given_name", "Demo");
	        user.addProperty("family_name", "User");
	        user.addProperty("password", "DemoPasswd1234");
	        user.addProperty("email", email);
	        user.addProperty("job_title", "Product Demonstrator");
		    user.addProperty("tel_work", "(212) 853-5987");

	        HttpPost createUserRequest = new HttpPost(server + baseUrl + "/v2.0/user");
	        StringEntity createUserParams = new StringEntity(user.toString());
	        createUserRequest.addHeader("Authorization", "Bearer " + accessToken);
	        createUserRequest.addHeader("content-type", "application/json");
	        createUserRequest.setEntity(createUserParams);
	        HttpResponse createUserResponse = httpClient.execute(createUserRequest);
		    if (createUserResponse.getStatusLine().getStatusCode() != 201) {
				throw new RuntimeException("Create User Failed : HTTP error code : "
				   + createUserResponse.getStatusLine().getStatusCode());
			}
		    root = jp.parse(new InputStreamReader((createUserResponse.getEntity().getContent())));
		    rootObj = root.getAsJsonObject();
		    userId = rootObj.get("user_id").getAsString();
		    userRefreshToken = rootObj.get("refresh_token").getAsString();
		    if (userId == null) {
				throw new RuntimeException("Create User Failed : Expected a user_id value here, but found: " +
						rootObj.toString());
		    }
		    if (userRefreshToken == null) {
				throw new RuntimeException("Create User Failed : Expected a refresh_token value here, but found: " +
						rootObj.toString());
		    }
		    System.out.println("Created user " + email + " with password " + userPassword);


		    /** Obtain an access token for the user using the pre-authorized refresh token **/

		    System.out.println("Obtaining an access token for that new user.");
		    // We can trade the `refresh_token` we got in the last call to obtain an `access_token` in the usual way.
		    String userAccessToken = null;
		    // Create the userPayload with Gson
		    JsonObject userPayload = new JsonObject();
		    userPayload.addProperty("client_id", clientId);
		    userPayload.addProperty("client_secret", clientSecret);
		    userPayload.addProperty("grant_type", "refresh_token");
		    userPayload.addProperty("refresh_token", userRefreshToken);

		    HttpPost userAcessRequest = new HttpPost(server + baseUrl + "/auth/oauth2/access");
	        StringEntity userAcessParams = new StringEntity(userPayload.toString());
	        userAcessRequest.addHeader("Authorization", "Bearer " + accessToken);
	        userAcessRequest.addHeader("content-type", "application/json");
	        userAcessRequest.setEntity(userAcessParams);
	        HttpResponse userAcessResponse = httpClient.execute(userAcessRequest);
		    if (userAcessResponse.getStatusLine().getStatusCode() != 200) {
				throw new RuntimeException("Get User Access Failed : HTTP error code : "
				   + userAcessResponse.getStatusLine().getStatusCode());
			}
		    root = jp.parse(new InputStreamReader((userAcessResponse.getEntity().getContent())));
		    rootObj = root.getAsJsonObject();
		    userAccessToken = rootObj.get("access_token").getAsString();
		    if (userAccessToken == null) {
				throw new RuntimeException("Get User Access Failed : Expected an access_token value here, but found: " +
						rootObj.toString());
		    }


		    /** Hit a test method to demonstrate that the user access token works **/

		    System.out.println("Confirming our user-level access works by hitting /v2.0/ping/authed.");
		    HttpGet testUserAccessRequest = new HttpGet(server + baseUrl + "/v2.0/ping/authed");
		    testUserAccessRequest.setHeader("Authorization", "Bearer " + userAccessToken);
		    HttpResponse testUserAccessResponse = httpClient.execute(testUserAccessRequest);
		    if (testUserAccessResponse.getStatusLine().getStatusCode() != 200) {
				throw new RuntimeException("Test User Access Failed : HTTP error code : "
				   + testUserAccessResponse.getStatusLine().getStatusCode());
			}
		    root = jp.parse(new InputStreamReader((testUserAccessResponse.getEntity().getContent())));
		    rootObj = root.getAsJsonObject();
		    String userAccessTimestamp = rootObj.get("timestamp").getAsString();
		    if (userAccessTimestamp == null) {
				throw new RuntimeException("Test User Access Failed : Expected a timestamp value here, but found: " +
						rootObj.toString());
		    }


			/** Fetch a list of orgs (should be empty) **/

		    System.out.println("Get a list of the orgs the user has access to (should be empty).");
		    HttpGet orgsRequest = new HttpGet(server + baseUrl + "/v2.0/orgs");
		    orgsRequest.setHeader("Authorization", "Bearer " + userAccessToken);
		    HttpResponse orgsResponse = httpClient.execute(orgsRequest);
		    if (orgsResponse.getStatusLine().getStatusCode() != 200) {
				throw new RuntimeException("Orgs Request Failed : HTTP error code : "
				   + orgsResponse.getStatusLine().getStatusCode());
			}
		    root = jp.parse(new InputStreamReader((orgsResponse.getEntity().getContent())));
		    if (!root.isJsonArray()) {
		    	throw new RuntimeException("Orgs Request Failed : Response was not an array");
		    }
		    if (root.getAsJsonArray().size() != 0) {
		    	throw new RuntimeException("Orgs Request Failed : Response was not an empty array");
		    }


			/** Create a new org for that user **/

		    System.out.println("Create a new org for that user.");
		    String orgId = null;
		    // Create the userPayload with Gson
		    String orgName = email + "'s Demo Org";
		    JsonObject org = new JsonObject();
		    org.addProperty("name", orgName);

		    HttpPost createOrgRequest = new HttpPost(server + baseUrl + "/v2.0/org");
	        StringEntity createOrgParams = new StringEntity(org.toString());
	        createOrgRequest.addHeader("Authorization", "Bearer " + userAccessToken);
	        createOrgRequest.addHeader("content-type", "application/json");
	        createOrgRequest.setEntity(createOrgParams);
	        HttpResponse createOrgResponse = httpClient.execute(createOrgRequest);
		    if (createOrgResponse.getStatusLine().getStatusCode() != 201) {
				throw new RuntimeException("Create Org Failed : HTTP error code : "
				   + createOrgResponse.getStatusLine().getStatusCode());
			}
		    root = jp.parse(new InputStreamReader((createOrgResponse.getEntity().getContent())));
		    rootObj = root.getAsJsonObject();
		    orgId = rootObj.get("org_id").getAsString();
		    if (orgId == null) {
				throw new RuntimeException("Create Org Failed : Expected a org_id value here, but found: " +
						rootObj.toString());
		    }
		    System.out.println("Created org " + orgName);


			/** Fetch a list of orgs (should be non-empty) **/

		    System.out.println("List the orgs again (should be non-empty).");
		    HttpGet orgsNonEmptyRequest = new HttpGet(server + baseUrl + "/v2.0/orgs");
		    orgsNonEmptyRequest.setHeader("Authorization", "Bearer " + userAccessToken);
		    HttpResponse orgsNonEmptyResponse = httpClient.execute(orgsNonEmptyRequest);
		    if (orgsNonEmptyResponse.getStatusLine().getStatusCode() != 200) {
				throw new RuntimeException("Orgs Non-Empty Request Failed : HTTP error code : "
				   + orgsNonEmptyResponse.getStatusLine().getStatusCode());
			}
		    root = jp.parse(new InputStreamReader((orgsNonEmptyResponse.getEntity().getContent())));
		    if (!root.isJsonArray()) {
		    	throw new RuntimeException("Orgs Non-Empty Request Failed : Response was not an array");
		    }
		    if (root.getAsJsonArray().size() == 0) {
		    	throw new RuntimeException("Orgs Non-Empty Request Failed : Response was an empty array, but 1 org should be present");
		    }


			/** Fetch a list of workspaces **/

		    System.out.println("List the workspaces in that org.");
		    String workspaceId = null;
		    HttpGet workspaceRequest = new HttpGet(server + baseUrl + "/v2.0/org/" + orgId + "/workspaces");
		    workspaceRequest.setHeader("Authorization", "Bearer " + userAccessToken);
		    HttpResponse workspaceResponse = httpClient.execute(workspaceRequest);
		    if (workspaceResponse.getStatusLine().getStatusCode() != 200) {
				throw new RuntimeException("Workspace Request Failed : HTTP error code : "
				   + workspaceResponse.getStatusLine().getStatusCode());
			}
		    root = jp.parse(new InputStreamReader((workspaceResponse.getEntity().getContent())));
		    if (!root.isJsonArray()) {
		    	throw new RuntimeException("Workspace Request Failed : Response was not an array");
		    }
		    workspaceId = root.getAsJsonArray().get(0).getAsJsonObject().get("workspace_id").toString();
		    if (workspaceId == null) {
		    	throw new RuntimeException("Workspace Request Failed : Expected a workspace_id value here, but found: " +
		    			root.getAsJsonArray().get(0).toString());
		    }


			/** Fetch a list of notes **/

		    System.out.println("List notes in that workspace.");
		    HttpGet noteRequest = new HttpGet(server + baseUrl + "/v2.0/org/" + orgId + "/workspace/" + workspaceId + "/notes");
		    noteRequest.setHeader("Authorization", "Bearer " + userAccessToken);
		    HttpResponse noteResponse = httpClient.execute(noteRequest);
		    if (noteResponse.getStatusLine().getStatusCode() != 200) {
				throw new RuntimeException("Note Request Failed : HTTP error code : "
				   + noteResponse.getStatusLine().getStatusCode());
			}
		    root = jp.parse(new InputStreamReader((noteResponse.getEntity().getContent())));
		    if (!root.isJsonArray()) {
		    	throw new RuntimeException("Note Request Failed : Response was not an array");
		    }
		    String noteId = root.getAsJsonArray().get(0).getAsJsonObject().get("note_id").toString();
		    if (noteId == null) {
		    	throw new RuntimeException("Note Request Failed : Expected a note_id value here, but found: " +
		    			root.getAsJsonArray().get(0).toString());
		    }


		    /** Let us create a second user **/

		    System.out.println("Creating a second new user.");
		    String secondEmail = new Date().getTime() + "-" + Math.round(Math.random() * 10000) + "@example.org";
		    String secondUserId = null;
		    String secondUserRefreshToken = null;
		    String secondUserPassword = "DemoPasswd2345";

		    JsonObject secondUser = new JsonObject();
		    secondUser.addProperty("given_name", "Demo2");
		    secondUser.addProperty("family_name", "User2");
		    secondUser.addProperty("password", secondUserPassword);
		    secondUser.addProperty("email", secondEmail);
		    secondUser.addProperty("job_title", "Second User");

	        HttpPost createSecondUserRequest = new HttpPost(server + baseUrl + "/v2.0/user");
	        StringEntity createSecondUserParams = new StringEntity(secondUser.toString());
	        createSecondUserRequest.addHeader("Authorization", "Bearer " + accessToken);
	        createSecondUserRequest.addHeader("content-type", "application/json");
	        createSecondUserRequest.setEntity(createSecondUserParams);
	        HttpResponse createSecondUserResponse = httpClient.execute(createSecondUserRequest);
		    if (createSecondUserResponse.getStatusLine().getStatusCode() != 201) {
				throw new RuntimeException("Create Second User Failed : HTTP error code : "
				   + createSecondUserResponse.getStatusLine().getStatusCode());
			}
		    root = jp.parse(new InputStreamReader((createSecondUserResponse.getEntity().getContent())));
		    rootObj = root.getAsJsonObject();
		    secondUserId = rootObj.get("user_id").getAsString();
		    secondUserRefreshToken = rootObj.get("refresh_token").getAsString();
		    if (secondUserId == null) {
				throw new RuntimeException("Create Second User Failed : Response did not contain a user id");
		    }
		    if (secondUserRefreshToken == null) {
				throw new RuntimeException("Create Second User Failed : Response did not contain a refresh token");
		    }
		    System.out.println("Created user " + secondEmail + " with password " + secondUserPassword);


		    /** Add the second user to the org **/

		    System.out.println("Adding second user to org.");
		    // Create the userPayload with Gson
		    JsonObject orgAccessLevel = new JsonObject();
		    orgAccessLevel.addProperty("access_type", "FULL");

		    HttpPost addUserToOrgRequest = new HttpPost(server + baseUrl + "/v2.0/org/" + orgId + "/member/" + secondUserId);
	        StringEntity addUserToOrgParams = new StringEntity(orgAccessLevel.toString());
	        addUserToOrgRequest.addHeader("Authorization", "Bearer " + userAccessToken);
	        addUserToOrgRequest.addHeader("content-type", "application/json");
	        addUserToOrgRequest.setEntity(addUserToOrgParams);
	        HttpResponse addUserToOrgResponse = httpClient.execute(addUserToOrgRequest);
		    if (addUserToOrgResponse.getStatusLine().getStatusCode() != 201) {
				throw new RuntimeException("Add Second User To Org Failed : HTTP error code : "
				   + addUserToOrgResponse.getStatusLine().getStatusCode());
			}

		    /*
		     * The following line is there because you must consume the response
		     * body before you can reuse the connection in HttpClient for
		     * another request.
		     */
		    root = jp.parse(new InputStreamReader((addUserToOrgResponse.getEntity().getContent())));


		    /** Fetch a list of org members **/

		    System.out.println("List the members in that org.");
		    HttpGet membersRequest = new HttpGet(server + baseUrl + "/v2.0/org/" + orgId + "/members");
		    membersRequest.setHeader("Authorization", "Bearer " + userAccessToken);
		    HttpResponse membersResponse = httpClient.execute(membersRequest);
		    if (membersResponse.getStatusLine().getStatusCode() != 200) {
				throw new RuntimeException("Members Request Failed : HTTP error code : "
				   + membersResponse.getStatusLine().getStatusCode());
			}
		    root = jp.parse(new InputStreamReader((membersResponse.getEntity().getContent())));
		    if (!root.isJsonArray()) {
		    	throw new RuntimeException("Members Request Failed : Response was not an array");
		    }
		    if (root.getAsJsonArray().size() != 2) {
		    	throw new RuntimeException("Members Request Failed : Response should have contained 2 members but instead contained " +
		    			root.getAsJsonArray().size());
		    }

		    System.out.println("All Tests completed successfully!");
	    }catch (Exception ex) {
		    ex.printStackTrace();
	    } finally {
	        httpClient.getConnectionManager().shutdown();
	    }
	}

	/*
	 * This method is used to wrap the default HttpClient with an HttpClient
	 * that accepts any SSL certificate.  For further information please see:
	 * 	http://javaskeleton.blogspot.com/2010/07/avoiding-peer-not-authenticated-with.html
	 */
	public static HttpClient wrapClient(HttpClient base) {
		try {
			SSLContext ctx = SSLContext.getInstance("TLS");
			X509TrustManager tm = new X509TrustManager() {
				public void checkClientTrusted(X509Certificate[] xcs, String string) throws CertificateException {
				}

				public void checkServerTrusted(X509Certificate[] xcs, String string) throws CertificateException {
				}

				public X509Certificate[] getAcceptedIssuers() {
					return null;
				}
			};
			ctx.init(null, new TrustManager[]{tm}, null);
			SSLSocketFactory ssf = new SSLSocketFactory(ctx);
			ssf.setHostnameVerifier(SSLSocketFactory.ALLOW_ALL_HOSTNAME_VERIFIER);
			ClientConnectionManager ccm = base.getConnectionManager();
			SchemeRegistry sr = ccm.getSchemeRegistry();
			sr.register(new Scheme("https", ssf, 443));
			return new DefaultHttpClient(ccm, base.getParams());
		} catch (Exception ex) {
			ex.printStackTrace();
			return null;
		}
	}
}
