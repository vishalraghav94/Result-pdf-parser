## Prerequisite
#### if you are using provided json file just follow
    1. run 'npm install'
    2. run 'node server.js'
    3. run app on 'http://localhost:3000'
#### Note: I have included json file with data of every student. If you want to create your own json file using pdf follow below mentioned step.

1. Install Poppler :

	For Mac - 'brew install poppler'

    Why- It uses pdfseparator tool which comes bundled with poppler
 2. It is made specifically for IPU result pdf format. So it wont work on other pdfs
 3. run 'npm install'
 #### Usage
	use command as:
	node test.js pdf_filename outfilename.json
	e.g. 'node test.js result.pdf 3rdsem.json'
