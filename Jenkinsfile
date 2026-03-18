pipeline {
    agent any

    tools {
        nodejs 'NodeJS 22'
    }



    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
