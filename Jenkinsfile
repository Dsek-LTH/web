pipeline {
  agent any

  stages {
    stage('Deploy') {
      steps {
        sh 'curl -LO https://github.com/Dsek-LTH/web/releases/latest/download/build.zip --output build.zip'
        sshagent(['45de3cc4-88e1-4955-89c0-61d7b027d05f']) {
          sh 'scp build.zip transferUser@web-beta:/var/www'
          sh 'ssh transferUser@web-beta < ./prod/deploy-script.sh'
        }
      }
    }
  }
}