pipeline {
    agent {
      label 'Buildnode-1'
    }

    stages {
        stage('Build') {
            steps {
              nodejs('nodejs-20.0') {
                sh '''pnpm i
                  pnpm run ci-check
                  pnpm run build'''
              }
            }
        }
    }
}