import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Infrastructure from '../lib/infrastructure-stack';

test('S3 Bucket Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Infrastructure.InfrastructureStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResource("AWS::S3::Bucket"));
});

