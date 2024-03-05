pipeline {
    agent {
      label 'Buildnode-1'
    }

    stages {
        stage('Build') {
            steps {
                sh 'pnpm i'
                sh 'pnpm run ci-check'
                sh 'pnpm run build'
            }
        }
    }
}