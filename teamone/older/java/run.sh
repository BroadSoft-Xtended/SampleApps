#!/bin/bash

[ -z "$CP_HOME" ] && CP_HOME=~/.m2/repository

export CP_HOME
export HTTPCLIENT_JAR=$CP_HOME/org/apache/httpcomponents/httpclient/4.1.1/httpclient-4.1.1.jar
export HTTPCORE_JAR=$CP_HOME/org/apache/httpcomponents/httpcore/4.1/httpcore-4.1.jar
export GSON_JAR=$CP_HOME/com/google/code/gson/gson/2.3.1/gson-2.3.1.jar
export COMMONS_LOGGING_JAR=$CP_HOME/commons-logging/commons-logging/1.1.1/commons-logging-1.1.1.jar
export COMMONS_CODEC_JAR=$CP_HOME/commons-codec/commons-codec/1.4/commons-codec-1.4.jar
export SAMPLE_CODE_JAR=target/sample-code-1.0.jar
export CP_JARS=$HTTPCLIENT_JAR:$HTTPCORE_JAR:$GSON_JAR:$COMMONS_LOGGING_JAR:$COMMONS_CODEC_JAR:$SAMPLE_CODE_JAR

java -cp $CP_JARS net.intellinote.sample.CreateUser
