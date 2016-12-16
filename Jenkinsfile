node('docker') { // <1>
    stage('Build') { // <2>
        docker.image('python:3.5').inside {
          // run your command
          sh "pip install -r requirements.txt"
        }
    }
    stage('Test') {
        /* .. snip .. */
    }
    stage('Deploy') {
        /* .. snip .. */
    }
}
