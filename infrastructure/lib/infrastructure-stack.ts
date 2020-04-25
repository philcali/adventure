import * as s3 from '@aws-cdk/aws-s3';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as cdk from '@aws-cdk/core';

const TTL = cdk.Duration.minutes(5);
const DOMAIN_NAME = 'philcali.me';
const ZONE_ID = 'ZI7HL5YZ6FD32';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO: import this resource into a template, pls
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'PersonalHZ', {
      hostedZoneId: ZONE_ID,
      zoneName: DOMAIN_NAME
    });

    const validatedCert = new acm.Certificate(this, 'AdventureWebsiteCert', {
      domainName: '*.philcali.me',
      validationMethod: acm.ValidationMethod.DNS
    });

    const websiteBucket = new s3.Bucket(this, 'AdventureWebsite', {
      cors: [{
        allowedOrigins: [ '*' ],
        allowedMethods: [
          s3.HttpMethods.GET,
          s3.HttpMethods.HEAD
        ]
      }],
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: true
      })
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI');

    const cdn = new cloudfront.CloudFrontWebDistribution(this, 'AdventureWebsiteCDN', {
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(validatedCert, {
        aliases: [ `adventure.${DOMAIN_NAME}`],
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016
      }),
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: websiteBucket,
          originAccessIdentity
        },
        behaviors: [{ isDefaultBehavior: true }]
      }]
    });

    const adventureRecordSet = new route53.CnameRecord(this, 'AdventureCNAME', {
      domainName: cdn.domainName,
      recordName: `adventure.${DOMAIN_NAME}`,
      zone: hostedZone,
      ttl: cdk.Duration.minutes(5)
    });
  }
}
