import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

export class GitlabOidcStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    const issuerUrl = this.node.tryGetContext('gitlabIssuerUrl') ?? 'https://gitlab.com'
    const audience = this.node.tryGetContext('gitlabAudience') ?? 'https://gitlab.com'
    const subjectPattern =
      this.node.tryGetContext('gitlabSubject') ??
      'project_path:YOUR_GROUP/YOUR_PROJECT:ref_type:branch:ref:main'

    const issuerHost = new URL(issuerUrl).host

    const provider = new iam.OpenIdConnectProvider(this, 'GitlabProvider', {
      url: issuerUrl,
      clientIds: [audience]
    })

    const role = new iam.Role(this, 'GitlabPipelineRole', {
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          [`${issuerHost}:aud`]: audience
        },
        StringLike: {
          [`${issuerHost}:sub`]: subjectPattern
        }
      })
    })

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*']
      })
    )

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:BatchCheckLayerAvailability',
          'ecr:CompleteLayerUpload',
          'ecr:InitiateLayerUpload',
          'ecr:PutImage',
          'ecr:UploadLayerPart',
          'ecr:DescribeRepositories',
          'ecr:DescribeImages',
          'ecr:ListImages',
          'ecr:BatchGetImage'
        ],
        resources: ['*']
      })
    )

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'cloudformation:CreateChangeSet',
          'cloudformation:CreateStack',
          'cloudformation:DeleteChangeSet',
          'cloudformation:DeleteStack',
          'cloudformation:DescribeChangeSet',
          'cloudformation:DescribeStacks',
          'cloudformation:DescribeStackEvents',
          'cloudformation:ExecuteChangeSet',
          'cloudformation:GetTemplate',
          'cloudformation:UpdateStack',
          'cloudformation:ValidateTemplate'
        ],
        resources: ['*']
      })
    )

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ec2:CreateSecurityGroup',
          'ec2:CreateTags',
          'ec2:DeleteSecurityGroup',
          'ec2:Describe*',
          'ec2:AuthorizeSecurityGroupIngress',
          'ec2:AuthorizeSecurityGroupEgress',
          'ec2:RevokeSecurityGroupIngress',
          'ec2:RevokeSecurityGroupEgress'
        ],
        resources: ['*']
      })
    )

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ecs:CreateCluster',
          'ecs:DeleteCluster',
          'ecs:Describe*',
          'ecs:RegisterTaskDefinition',
          'ecs:DeregisterTaskDefinition',
          'ecs:CreateService',
          'ecs:UpdateService',
          'ecs:DeleteService',
          'ecs:TagResource',
          'ecs:UntagResource'
        ],
        resources: ['*']
      })
    )

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'elasticloadbalancing:CreateLoadBalancer',
          'elasticloadbalancing:DeleteLoadBalancer',
          'elasticloadbalancing:CreateTargetGroup',
          'elasticloadbalancing:DeleteTargetGroup',
          'elasticloadbalancing:CreateListener',
          'elasticloadbalancing:DeleteListener',
          'elasticloadbalancing:ModifyListener',
          'elasticloadbalancing:ModifyTargetGroup',
          'elasticloadbalancing:RegisterTargets',
          'elasticloadbalancing:DeregisterTargets',
          'elasticloadbalancing:Describe*',
          'elasticloadbalancing:AddTags',
          'elasticloadbalancing:RemoveTags'
        ],
        resources: ['*']
      })
    )

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'iam:PassedToService': 'ecs-tasks.amazonaws.com'
          }
        }
      })
    )

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams'
        ],
        resources: ['*']
      })
    )

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          's3:CreateBucket',
          's3:DeleteBucket',
          's3:GetObject',
          's3:PutObject',
          's3:ListBucket'
        ],
        resources: ['*']
      })
    )

    new CfnOutput(this, 'GitlabOidcIssuerUrl', {
      value: issuerUrl
    })

    new CfnOutput(this, 'GitlabPipelineRoleArn', {
      value: role.roleArn
    })
  }
}

