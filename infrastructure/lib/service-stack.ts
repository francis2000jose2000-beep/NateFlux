import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps
} from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import { Construct } from 'constructs'

export class ServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    const vpc = new ec2.Vpc(this, 'Vpc', {
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        }
      ]
    })

    const repository = new ecr.Repository(this, 'Repository', {
      encryption: ecr.RepositoryEncryption.AES_256,
      imageScanOnPush: true,
      removalPolicy: RemovalPolicy.DESTROY,
      emptyOnDelete: true
    })

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      containerInsights: true
    })

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    })

    const executionRole = new iam.Role(this, 'ExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        )
      ]
    })

    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY
    })

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      cpu: 256,
      memoryLimitMiB: 512,
      taskRole,
      executionRole
    })

    const container = taskDefinition.addContainer('Api', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'api'
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        LOG_LEVEL: 'info'
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          "node -e \"fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\""
        ],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(10)
      }
    })

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP
    })

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'Service',
      {
        cluster,
        desiredCount: 1,
        publicLoadBalancer: true,
        taskDefinition,
        assignPublicIp: false,
        taskSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        },
        listenerPort: 80,
        healthCheckGracePeriod: Duration.seconds(30)
      }
    )

    service.targetGroup.configureHealthCheck({
      path: '/health',
      healthyHttpCodes: '200'
    })

    new CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repositoryUri
    })

    new CfnOutput(this, 'LoadBalancerDnsName', {
      value: service.loadBalancer.loadBalancerDnsName
    })
  }
}
