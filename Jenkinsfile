pipeline {
    agent any

    tools {
        nodejs 'NodeJS 22'
    }

    stages {
        stage('Install') {
            steps {
                // The agent's own npm config points at a GBIF registry path that
                // 404s for everything, so override it with public npm, the
                // registry the lockfile, local installs and GitHub Pages use too
                // (as gbif-web does). Don't add a project .npmrc, see d1799c4.
                sh 'npm ci --registry=https://registry.npmjs.org/'
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
