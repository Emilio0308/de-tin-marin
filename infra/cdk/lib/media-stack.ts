import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

export interface MediaStackProps extends cdk.StackProps {
  /** Logical env label used in resource names (e.g. staging). */
  environmentName: string;
  /** Browser origins allowed to PUT/GET objects (admin app). */
  corsAllowedOrigins: string[];
}

/**
 * Private S3 bucket for catalog images + CloudFront (OAC) for HTTPS reads.
 * IAM uploader user can PutObject (presign from admin); access keys are created manually.
 */
export class MediaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MediaStackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "MediaBucket", {
      bucketName: `media-${props.environmentName}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      publicReadAccess: false,
      cors:
        props.corsAllowedOrigins.length > 0
          ? [
              {
                allowedMethods: [
                  s3.HttpMethods.GET,
                  s3.HttpMethods.HEAD,
                  s3.HttpMethods.PUT,
                ],
                allowedOrigins: props.corsAllowedOrigins,
                allowedHeaders: ["*"],
                exposedHeaders: ["ETag"],
                maxAge: 3000,
              },
            ]
          : undefined,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const distribution = new cloudfront.Distribution(
      this,
      "MediaDistribution",
      {
        comment: `media-${props.environmentName}`,
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          compress: true,
        },
      },
    );

    const uploader = new iam.User(this, "MediaUploader", {
      userName: `media-uploader-${props.environmentName}`,
    });

    uploader.addToPolicy(
      new iam.PolicyStatement({
        sid: "PutMediaObjects",
        actions: ["s3:PutObject", "s3:AbortMultipartUpload"],
        resources: [bucket.arnForObjects("*")],
      }),
    );

    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
      description: "S3 bucket for catalog media objects",
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
      description: "CloudFront distribution domain",
    });

    new cdk.CfnOutput(this, "CdnBaseUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "Base HTTPS URL to store in image_url / env",
    });

    new cdk.CfnOutput(this, "UploaderUserName", {
      value: uploader.userName,
      description:
        "IAM user for admin presigned uploads — create an access key in the AWS console",
    });
  }
}
