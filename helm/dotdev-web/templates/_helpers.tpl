{{- define "dotdev-web.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "dotdev-web.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- include "dotdev-web.name" . | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "dotdev-web.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "dotdev-web.image" -}}
{{- $repository := required "image.repository is required" .Values.image.repository -}}
{{- $version := default .Chart.AppVersion .Values.image.version -}}
{{- $tag := default $version .Values.image.tag -}}
{{- $digest := default "" .Values.image.digest -}}
{{- if and .Values.image.requireDigest (eq $digest "") -}}
{{- fail "image.digest must be set when image.requireDigest is true" -}}
{{- end -}}
{{- if and (ne $digest "") (not (regexMatch `^sha256:[a-f0-9]{64}$` $digest)) -}}
{{- fail "image.digest must be an immutable sha256 digest" -}}
{{- end -}}
{{- if ne $digest "" -}}
{{- printf "%s@%s" $repository $digest -}}
{{- else -}}
{{- if eq $tag "latest" -}}
{{- fail "image.tag must not be latest" -}}
{{- end -}}
{{- printf "%s:%s" $repository $tag -}}
{{- end -}}
{{- end -}}

{{- define "dotdev-web.labels" -}}
helm.sh/chart: {{ include "dotdev-web.chart" . }}
app.kubernetes.io/name: {{ include "dotdev-web.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ default .Chart.AppVersion .Values.image.version | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "dotdev-web.selectorLabels" -}}
app: {{ include "dotdev-web.fullname" . }}
app.kubernetes.io/name: {{ include "dotdev-web.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "dotdev-web.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "dotdev-web.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}
