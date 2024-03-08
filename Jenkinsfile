pipeline {
  agent any

  options {
    ansiColor('xterm') //test
  }
  stages {
    stage('Build') {
      steps {
        nodejs('nodejs-20.0') {
          sh 'pnpm i'
          sh 'pnpm run ci-check'
          sh 'pnpm run build'
        }
      }
    }
  }
}