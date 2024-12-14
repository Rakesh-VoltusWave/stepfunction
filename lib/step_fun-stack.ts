import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as aws_sqs from 'aws-cdk-lib/aws-sqs';      // For SQS Queue
import * as aws_lambda from 'aws-cdk-lib/aws-lambda'; // For Lambda function
import { join } from 'path';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';  // For Lambda invocation in Step Functions
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';  // For Step Functions
import { SqsDestination } from 'aws-cdk-lib/aws-lambda-destinations';


export class StepFunStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Step 1: Create an SQS queue
    const myQueue = new aws_sqs.Queue(this, 'MyQueue', {
      queueName: 'myQueueSfn',
    });

    // Step 2: Create a Lambda function
    const mySqsLambda = new aws_lambda.Function(this, 'MyLambda', {
      runtime: aws_lambda.Runtime.NODEJS_LATEST,
      handler: 'sqsLambda.handler', 
      code: aws_lambda.Code.fromAsset(join(__dirname, '../lambdas')),
      onSuccess:new SqsDestination(myQueue)
    });
   
    
    myQueue.grantSendMessages(mySqsLambda);

    //invoking lambda fn
    const invokeSQSFunction = new tasks.LambdaInvoke(this, 'Invoke SQSLambda', {
      lambdaFunction: mySqsLambda, 
    });

    const definition = invokeSQSFunction; 

   
    new sfn.StateMachine(this, 'StateMachine', {
      definition,
      timeout: cdk.Duration.minutes(5),
      comment: 'State machine that invokes SQS Lambda',
    });
  }
}
