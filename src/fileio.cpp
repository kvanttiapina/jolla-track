#include "fileio.h"
#include <QDebug>
#include <QFile>

FileIO::FileIO(QObject *parent): QObject(parent) {}

QString FileIO::read(const QString& path)
{
    if (path.isEmpty()){
        emit error("path is empty");
        return QString();
    }

    QFile file(path);

    QString fileContent;
    if (file.open(QIODevice::ReadOnly)) {
        QString line;
        QTextStream t(&file);
        do {
            line = t.readLine();
            fileContent += line;
         } while (!line.isNull());

        file.close();
    } else {
        emit error("Unable to open the file");
        return QString();
    }
    return fileContent;
}

bool FileIO::write(const QString& path, const QString& data)
{
    if (path.isEmpty()) return false;

    QFile file(path);
    if (!file.open(QFile::WriteOnly | QFile::Truncate)) return false;

    QTextStream out(&file);
    out << data;

    file.close();

    return true;
}

