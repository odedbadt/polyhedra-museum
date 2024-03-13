import datetime

from flask import Flask, render_template
from glob import glob
app = Flask(__name__)


@app.route("/")
def root():
    # For the sake of example, use static information to inflate the template.
    # This will be replaced with real information in later steps.
    models = [s.split('/')[-1].replace('.json', '') for s in glob('static/models/*.json')]
    print(models)
    models = [s.split('/')[-1].replace('.json', '') for s in glob('static/models/*.json')]
    return render_template("index.html", models=models, first_model=models[0])


if __name__ == "__main__":
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    # Flask's development server will automatically serve static files in
    # the "static" directory. See:
    # http://flask.pocoo.org/docs/1.0/quickstart/#static-files. Once deployed,
    # App Engine itself will serve those files as configured in app.yaml.
    app.run(host="127.0.0.1", port=8080, debug=True)
    print('llll')