This directory contains Java-based examples of using the Intellinote APIs.

**CreateUser.java** (`src/main/java/net/intellinote/sample/CreateUser.java`)

Demonstrates:

1. application-level (userless) authentication via the OAuth2 "client-credentials" grant.
2. using that application-level access to create a new user.
3. authenticating on behalf of that user using the OAuth2 "refresh-token" grant.
4. acting as that user to create new organizations, workspaces, etc.

**OEMSSOExample.java** (`src/main/java/net/intellinote/sample/OEMSSOExample.java`)

Demonstrates:

1. application-level (userless) authentication via the OAuth2 "client-credentials" grant.
2. using that application-level access to create a couple of new user.
3. authenticating on behalf of one of those users using the OAuth2 "refresh-token" grant.
4. acting as that user to create a new organization and workspace.
5. acting as that user to add other users to the shared organization and workspace
6. using the HMAC-based Single-Sign-On protocol to generate a link that authenticates as one of those users and launches Intellinote directly into that shared workspace.

**To run these examples** you can do one of the following:

**Either** build the examples with Maven using the provided `pom.xml` file:

```console
mvn package
mvn exec:java
```

**Or,** make sure that the following jars are in your classpath and just run `net.intellinote.sample.CreateUser`.  An easy way to do this would be to modify the included `run.sh` or `run.bat` file to include the proper paths on your file system.
	* 	httpclient-4.4.jar (Apache's Http Client)
 	* 	httpcore-4.4.jar (dependency of httpclient)
 	* 	gson-2.3.1.jar (Google's Json Parser)
 	* 	commons-logging-1.1.1.jar (dependency of gson)
 	* 	commons-codec-1.4.jar (dependency of gson)
