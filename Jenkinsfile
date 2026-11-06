pipeline {
    agent any

    tools {
        nodejs 'NodeJS 22'
    }

    stages {
        stage('Install') {
            steps {
                // The agent's own npm config points at a GBIF registry path that
                // 404s for everything, so anything not already in its npm cache
                // fails. Use the GBIF npm mirror: --registry also rewrites the
                // lockfile's registry.npmjs.org URLs to it. Don't add a project
                // .npmrc instead, see d1799c4.
                sh 'npm ci --registry=https://repository-mirror.gbif.org/repository/npmjs/'
            }
        }

        stage('Typecheck') {
            steps {
                sh 'npm run typecheck'
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
