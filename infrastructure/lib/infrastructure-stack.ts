import * as s3 from '@aws-cdk/aws-s3';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as lambda from '@aws-cdk/aws-lambda';
import * as events from '@aws-cdk/aws-lambda-event-sources';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';

import fs = require('fs');
import path = require('path');

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

    const codePath = path.join(__dirname, 'handlers/invalidate.js');

    const invalidation = new lambda.Function(this, 'Invalidation', {
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline(fs.readFileSync(codePath).toString()),
      timeout: cdk.Duration.minutes(1),
      memorySize: 128
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

    invalidation.addEnvironment('CDN', cdn.distributionId);
    invalidation.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [ 'cloudfront:createInvalidation' ],
      resources: [ this.formatArn({
        service: 'cloudfront',
        region: '',
        resource: `distribution/${cdn.distributionId}`,
        sep: ':'
      }) ]
    }));


    invalidation.addEventSource(new events.S3EventSource(websiteBucket, {
      events: [ s3.EventType.OBJECT_CREATED ],
      filters: [{
        suffix: 'index.html'
      }]
    }));

    const adventureRecordSet = new route53.CnameRecord(this, 'AdventureCNAME', {
      domainName: cdn.domainName,
      recordName: `adventure.${DOMAIN_NAME}`,
      zone: hostedZone,
      ttl: cdk.Duration.minutes(5)
    });
  }
}
