node { // <1>
    stage('Build') { // <2>
	      sh 'docker-compose build'
        sh 'docker-compose up'
    }
    stage('Test') {
        /* .. snip .. */
    }
    stage('Deploy') {
        /* .. snip .. */
    }
}
