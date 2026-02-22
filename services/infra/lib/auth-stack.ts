import { Stack, StackProps, Duration, RemovalPolicy, CfnOutput, SecretValue } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";

interface AuthStackProps extends StackProps {
  stage: string;
}

export class AuthStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // --- Cognito User Pool ---
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `dealscope-users-${stage}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: false, mutable: true },
        familyName: { required: false, mutable: true },
      },
      customAttributes: {
        subscriptionTier: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
        tempPasswordValidity: Duration.days(7),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:
        stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // --- Google Identity Provider ---
    // Replace placeholder values with real credentials before deploying
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
      this,
      "GoogleProvider",
      {
        userPool: this.userPool,
        clientId: "GOOGLE_CLIENT_ID_PLACEHOLDER",
        clientSecretValue: SecretValue.unsafePlainText(
          "GOOGLE_CLIENT_SECRET_PLACEHOLDER"
        ),
        scopes: ["profile", "email", "openid"],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
          familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
        },
      }
    );

    // --- Apple Identity Provider ---
    // Replace placeholder values with real credentials before deploying
    const appleProvider = new cognito.UserPoolIdentityProviderApple(
      this,
      "AppleProvider",
      {
        userPool: this.userPool,
        clientId: "APPLE_SERVICE_ID_PLACEHOLDER",
        teamId: "APPLE_TEAM_ID_PLACEHOLDER",
        keyId: "APPLE_KEY_ID_PLACEHOLDER",
        privateKey: "APPLE_PRIVATE_KEY_PLACEHOLDER",
        scopes: ["email", "name"],
        attributeMapping: {
          email: cognito.ProviderAttribute.APPLE_EMAIL,
          givenName: cognito.ProviderAttribute.APPLE_FIRST_NAME,
          familyName: cognito.ProviderAttribute.APPLE_LAST_NAME,
        },
      }
    );

    // --- User Pool Domain (for hosted UI / OAuth redirects) ---
    this.userPool.addDomain("Domain", {
      cognitoDomain: {
        domainPrefix: `dealscope-${stage}`,
      },
    });

    // --- User Pool Client (mobile app) ---
    this.userPoolClient = this.userPool.addClient("MobileAppClient", {
      userPoolClientName: `dealscope-mobile-${stage}`,
      generateSecret: false, // No secret for public mobile clients
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          "dealscope://callback",
          "http://localhost:3000/callback",
        ],
        logoutUrls: [
          "dealscope://signout",
          "http://localhost:3000/signout",
        ],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
        cognito.UserPoolClientIdentityProvider.APPLE,
      ],
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
      preventUserExistenceErrors: true,
    });

    // Ensure providers are created before the client references them
    this.userPoolClient.node.addDependency(googleProvider);
    this.userPoolClient.node.addDependency(appleProvider);

    // --- Outputs ---
    new CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      exportName: `dealscope-${stage}-user-pool-id`,
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      exportName: `dealscope-${stage}-user-pool-client-id`,
    });

    new CfnOutput(this, "UserPoolDomain", {
      value: `dealscope-${stage}.auth.${this.region}.amazoncognito.com`,
      exportName: `dealscope-${stage}-user-pool-domain`,
    });
  }
}
