#ifndef FILEIO_H
#define FILEIO_H

#include <QObject>
#include <QDebug>

class FileIO : public QObject
{
    Q_OBJECT

public:

    explicit FileIO(QObject *parent = 0);

    Q_INVOKABLE QString read(const QString& path);
    Q_INVOKABLE bool write(const QString& path, const QString& data);


signals:

    void error(const QString& msg);

};

#endif // FILEIO_H
