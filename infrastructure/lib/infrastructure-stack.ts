import * as acm from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as website from '@philcali-cdk/static-website';
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

    const certificate = new acm.Certificate(this, 'AdventureWebsiteCert', {
      domainName: '*.philcali.me',
      validationMethod: acm.ValidationMethod.DNS
    });

    const staticWebsite = new website.StaticWebsite(this, 'AdventureWebsite', {
      domainName: `adventure.${DOMAIN_NAME}`,
      certificate,
      hostedZone
    });
  }
}
