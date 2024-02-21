from flask import Flask
app = Flask(__name__)

@app.route('/<int:number>/')
def incrementer(number):
    return "Incremented number is " + str(number+1)

@app.route('/teapot/')
def teapot():
    return "Would you like some tea?", 418

@app.before_request
def before():
    print("This is executed BEFORE each request.")
    
@app.route('/hello/')
def hello():
    return "Hello World!"

app.run()