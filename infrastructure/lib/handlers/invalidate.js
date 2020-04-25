const AWS = require('aws-sdk');
const cloudfront = new AWS.CloudFront();

exports.handler = (input, context, callback) => {
  const params = {
    DistributionId: process.env['CDN'],
    InvalidationBatch: {
      CallerReference: context.awsRequestId,
      Paths: {
        Quantity: 1,
        Items: [ '/*' ]
      }
    }
  };
  console.log(`Triggered by ${JSON.stringify(input)}`);
  cloudfront.createInvalidation(params, (err, data) => {
    console.log(`Invoked invalidation with params: ${JSON.stringify(params)}`);
    callback(err, data);
  });
};
