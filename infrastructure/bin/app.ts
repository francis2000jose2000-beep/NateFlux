import { App } from 'aws-cdk-lib'
import { ServiceStack } from '../lib/service-stack'
import { GitlabOidcStack } from '../lib/gitlab-oidc-stack'

const app = new App()

new ServiceStack(app, 'ServiceStack', {})
new GitlabOidcStack(app, 'GitlabOidcStack', {})

