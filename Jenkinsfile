pipeline {
    agent any

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