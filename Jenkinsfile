pipeline {
  agent any

  stages {
    stage('Deploy') {
      steps {
        sh 'curl -LO https://github.com/Dsek-LTH/web/releases/latest/download/build.zip --output build.zip'
      }
    }
  }
}